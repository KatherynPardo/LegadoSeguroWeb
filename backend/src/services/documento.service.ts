// Checklist de documentos de los herederos.
//   ADMINISTRADOR: mantiene el catálogo de requisitos y dice a qué TIPOS de activo aplica cada uno.
//   PROPIETARIO:   ve la lista de cada heredero y anota dónde está cada original.
//   HEREDERO:      ve su checklist (por el portal) y marca los documentos que ya tiene.
//
// Qué documentos le tocan a un heredero NO se elige a mano: depende de los activos que recibe.
//   - Un requisito sin tipos asignados aplica a todos los activos (el DNI, el certificado de defunción).
//   - Un requisito con tipos (por ejemplo la declaratoria de herederos para cuentas bancarias)
//     solo le toca al heredero que recibe algún activo de esos tipos.

import { pool } from '../config/database';

// Errores de regla de negocio: el controlador los convierte en 400, 404 o 409
export class ReglaDocumento extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

// Requisitos que le tocan a un heredero ($1 = id del heredero), con su estado y los activos que los motivan
const REQUISITOS_DEL_HEREDERO = `
  SELECT r.id_requisito AS id, r.nombre, r.descripcion, r.obligatorio, d.estado, d.ubicacion,
         COALESCE((SELECT array_agg(DISTINCT a.nombre)
                   FROM requisito_tipo rt
                   JOIN activo_digital a ON a.id_tipo = rt.id_tipo
                   JOIN activo_beneficiario ab ON ab.id_activo = a.id_activo
                   WHERE rt.id_requisito = r.id_requisito AND ab.id_beneficiario = $1
                     AND ab.estado = 'ACTIVO' AND a.estado = 'ACTIVO'), '{}') AS "aplicaA"
  FROM requisito_documental r
  LEFT JOIN documento_heredero d ON d.id_requisito = r.id_requisito AND d.id_beneficiario = $1
  WHERE r.estado = 'ACTIVO'
    AND (
      NOT EXISTS (SELECT 1 FROM requisito_tipo rt WHERE rt.id_requisito = r.id_requisito)
      OR EXISTS (SELECT 1 FROM requisito_tipo rt
                 JOIN activo_digital a ON a.id_tipo = rt.id_tipo
                 JOIN activo_beneficiario ab ON ab.id_activo = a.id_activo
                 WHERE rt.id_requisito = r.id_requisito AND ab.id_beneficiario = $1
                   AND ab.estado = 'ACTIVO' AND a.estado = 'ACTIVO')
    )
  ORDER BY r.obligatorio DESC, r.nombre`;

async function requisitosDelHeredero(idBeneficiario: number) {
  const r = await pool.query(REQUISITOS_DEL_HEREDERO, [idBeneficiario]);
  return r.rows.map(f => ({ ...f, estado: f.estado ?? 'PENDIENTE' }));
}

// ---------------------------------------------------------------
// ADMINISTRADOR: catálogo de requisitos
// ---------------------------------------------------------------

export async function listarCatalogo() {
  const resultado = await pool.query(
    `SELECT r.id_requisito AS id, r.nombre, r.descripcion, r.obligatorio, r.estado,
            COALESCE(array_agg(rt.id_tipo ORDER BY rt.id_tipo) FILTER (WHERE rt.id_tipo IS NOT NULL), '{}') AS tipos
     FROM requisito_documental r
     LEFT JOIN requisito_tipo rt ON rt.id_requisito = r.id_requisito
     GROUP BY r.id_requisito
     ORDER BY r.estado, r.obligatorio DESC, r.nombre`
  );
  return resultado.rows;
}

async function nombreRepetido(nombre: string, idExcluido: number | null): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM requisito_documental WHERE LOWER(nombre) = LOWER($1) AND id_requisito <> $2',
    [nombre, idExcluido ?? 0]
  );
  return r.rows.length > 0;
}

// Todos los tipos indicados deben existir
async function validarTipos(tipos: number[]): Promise<void> {
  if (tipos.length === 0) return;
  const r = await pool.query('SELECT id_tipo FROM tipo_activo WHERE id_tipo = ANY($1::int[])', [tipos]);
  if (r.rows.length !== new Set(tipos).size) throw new ReglaDocumento('Alguno de los tipos de activo no existe', 400);
}

async function guardarTipos(idRequisito: number, tipos: number[]): Promise<void> {
  await pool.query('DELETE FROM requisito_tipo WHERE id_requisito = $1', [idRequisito]);
  for (const t of new Set(tipos)) {
    await pool.query('INSERT INTO requisito_tipo (id_requisito, id_tipo) VALUES ($1, $2)', [idRequisito, t]);
  }
}

export async function crearRequisito(nombre: string, descripcion: string | null, obligatorio: boolean, tipos: number[]) {
  if (await nombreRepetido(nombre, null)) throw new ReglaDocumento('Ya existe un requisito con ese nombre', 409);
  await validarTipos(tipos);

  const r = await pool.query(
    'INSERT INTO requisito_documental (nombre, descripcion, obligatorio) VALUES ($1, $2, $3) RETURNING id_requisito AS id',
    [nombre, descripcion, obligatorio]
  );
  await guardarTipos(r.rows[0].id, tipos);
  return r.rows[0].id as number;
}

export async function editarRequisito(id: number, nombre: string, descripcion: string | null, obligatorio: boolean, estado: string, tipos: number[]) {
  if (await nombreRepetido(nombre, id)) throw new ReglaDocumento('Ya existe un requisito con ese nombre', 409);
  await validarTipos(tipos);

  const r = await pool.query(
    `UPDATE requisito_documental SET nombre = $1, descripcion = $2, obligatorio = $3, estado = $4
     WHERE id_requisito = $5 RETURNING id_requisito`,
    [nombre, descripcion, obligatorio, estado, id]
  );
  if (r.rows.length === 0) throw new ReglaDocumento('Requisito no encontrado', 404);
  await guardarTipos(id, tipos);
}

// ---------------------------------------------------------------
// PROPIETARIO: documentos de cada heredero
// ---------------------------------------------------------------

async function esDelPropietario(idBeneficiario: number, idUsuario: number): Promise<boolean> {
  const r = await pool.query(
    "SELECT 1 FROM beneficiario WHERE id_beneficiario = $1 AND id_usuario_propietario = $2 AND estado = 'ACTIVO'",
    [idBeneficiario, idUsuario]
  );
  return r.rows.length > 0;
}

export async function documentosDeHeredero(idBeneficiario: number, idUsuario: number) {
  if (!(await esDelPropietario(idBeneficiario, idUsuario))) throw new ReglaDocumento('Heredero no encontrado', 404);
  return requisitosDelHeredero(idBeneficiario);
}

export type ItemDocumento = { idRequisito: number; ubicacion: string | null };

// El propietario solo anota DÓNDE está cada original; los documentos que le tocan al heredero se deducen de sus activos
export async function guardarDocumentosDeHeredero(idBeneficiario: number, idUsuario: number, items: ItemDocumento[]) {
  if (!(await esDelPropietario(idBeneficiario, idUsuario))) throw new ReglaDocumento('Heredero no encontrado', 404);

  const aplicables = new Set((await requisitosDelHeredero(idBeneficiario)).map(r => r.id));
  if (items.some(i => !aplicables.has(i.idRequisito))) throw new ReglaDocumento('Alguno de los documentos no le corresponde a este heredero', 400);

  for (const i of items) {
    await pool.query(
      `INSERT INTO documento_heredero (id_beneficiario, id_requisito, ubicacion) VALUES ($1, $2, $3)
       ON CONFLICT (id_beneficiario, id_requisito) DO UPDATE SET ubicacion = EXCLUDED.ubicacion`,
      [idBeneficiario, i.idRequisito, i.ubicacion]
    );
  }

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
     VALUES ($1, 'EDITAR_DOCUMENTOS_HEREDERO', 'beneficiario', $2, 'Ubicación de los documentos del heredero actualizada')`,
    [idUsuario, idBeneficiario]
  );
}

// ---------------------------------------------------------------
// HEREDERO: portal
// ---------------------------------------------------------------

// El heredero se identifica por su correo (ya verificado). Si es heredero de varias personas, ve todas sus listas.
export async function checklistDelHeredero(correo: string) {
  const herederos = await pool.query(
    `SELECT b.id_beneficiario AS "idBeneficiario", b.nombres, b.apellidos, u.nombres || ' ' || u.apellidos AS benefactor
     FROM beneficiario b JOIN usuario u ON u.id_usuario = b.id_usuario_propietario
     WHERE LOWER(b.correo) = $1 AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE
     ORDER BY b.id_beneficiario`,
    [correo]
  );

  const listas = [];
  for (const h of herederos.rows) {
    listas.push({
      idBeneficiario: h.idBeneficiario,
      heredero: `${h.nombres} ${h.apellidos}`,
      benefactor: h.benefactor,
      documentos: await requisitosDelHeredero(h.idBeneficiario)
    });
  }
  return listas;
}

// El heredero marca (o desmarca) que ya tiene un documento. Solo puede tocar los suyos.
export async function marcarDocumento(idBeneficiario: number, idRequisito: number, correo: string, entregado: boolean): Promise<boolean> {
  const heredero = await pool.query(
    "SELECT 1 FROM beneficiario WHERE id_beneficiario = $1 AND LOWER(correo) = $2 AND estado = 'ACTIVO' AND correo_verificado = TRUE",
    [idBeneficiario, correo]
  );
  if (heredero.rows.length === 0) return false;

  const aplicables = (await requisitosDelHeredero(idBeneficiario)).map(r => r.id);
  if (!aplicables.includes(idRequisito)) return false;

  await pool.query(
    `INSERT INTO documento_heredero (id_beneficiario, id_requisito, estado, fecha_entrega)
     VALUES ($1, $2, $3::varchar, CASE WHEN $3::varchar = 'ENTREGADO' THEN NOW() ELSE NULL END)
     ON CONFLICT (id_beneficiario, id_requisito)
     DO UPDATE SET estado = EXCLUDED.estado, fecha_entrega = EXCLUDED.fecha_entrega`,
    [idBeneficiario, idRequisito, entregado ? 'ENTREGADO' : 'PENDIENTE']
  );

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
     VALUES (NULL, 'MARCAR_DOCUMENTO_HEREDERO', 'beneficiario', $1, $2)`,
    [idBeneficiario, `El heredero ${correo} marcó un documento como ${entregado ? 'entregado' : 'pendiente'}`]
  );
  return true;
}
