// Checklist de documentos de los herederos.
//   ADMINISTRADOR: mantiene el catálogo de requisitos.
//   PROPIETARIO:   elige qué requisitos tiene cada uno de sus herederos y dónde está cada original.
//   HEREDERO:      ve su checklist (por el portal) y marca los documentos que ya tiene.

import { PoolClient } from 'pg';
import { pool } from '../config/database';

type Db = Pick<PoolClient, 'query'>;

// Errores de regla de negocio: el controlador los convierte en 400, 404 o 409
export class ReglaDocumento extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

// ---------------------------------------------------------------
// ADMINISTRADOR: catálogo de requisitos
// ---------------------------------------------------------------

export async function listarCatalogo() {
  const resultado = await pool.query(
    `SELECT id_requisito AS id, nombre, descripcion, obligatorio, estado
     FROM requisito_documental ORDER BY estado, obligatorio DESC, nombre`
  );
  return resultado.rows;
}

// Los obligatorios se agregan solos a todos los herederos vigentes
async function asignarObligatoriosATodos(db: Db) {
  await db.query(
    `INSERT INTO documento_heredero (id_beneficiario, id_requisito)
     SELECT b.id_beneficiario, r.id_requisito
     FROM beneficiario b CROSS JOIN requisito_documental r
     WHERE b.estado = 'ACTIVO' AND r.obligatorio = TRUE AND r.estado = 'ACTIVO'
     ON CONFLICT (id_beneficiario, id_requisito) DO NOTHING`
  );
}

async function nombreRepetido(nombre: string, idExcluido: number | null): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM requisito_documental WHERE LOWER(nombre) = LOWER($1) AND id_requisito <> $2',
    [nombre, idExcluido ?? 0]
  );
  return r.rows.length > 0;
}

export async function crearRequisito(nombre: string, descripcion: string | null, obligatorio: boolean) {
  if (await nombreRepetido(nombre, null)) throw new ReglaDocumento('Ya existe un requisito con ese nombre', 409);

  const r = await pool.query(
    'INSERT INTO requisito_documental (nombre, descripcion, obligatorio) VALUES ($1, $2, $3) RETURNING id_requisito AS id',
    [nombre, descripcion, obligatorio]
  );
  if (obligatorio) await asignarObligatoriosATodos(pool);
  return r.rows[0].id as number;
}

export async function editarRequisito(id: number, nombre: string, descripcion: string | null, obligatorio: boolean, estado: string) {
  if (await nombreRepetido(nombre, id)) throw new ReglaDocumento('Ya existe un requisito con ese nombre', 409);

  const r = await pool.query(
    `UPDATE requisito_documental SET nombre = $1, descripcion = $2, obligatorio = $3, estado = $4
     WHERE id_requisito = $5 RETURNING id_requisito`,
    [nombre, descripcion, obligatorio, estado, id]
  );
  if (r.rows.length === 0) throw new ReglaDocumento('Requisito no encontrado', 404);
  if (obligatorio && estado === 'ACTIVO') await asignarObligatoriosATodos(pool);
}

// ---------------------------------------------------------------
// PROPIETARIO: requisitos de cada heredero
// ---------------------------------------------------------------

// Se usa al registrar un heredero: recibe los documentos obligatorios
export async function asignarObligatorios(db: Db, idBeneficiario: number) {
  await db.query(
    `INSERT INTO documento_heredero (id_beneficiario, id_requisito)
     SELECT $1, id_requisito FROM requisito_documental WHERE obligatorio = TRUE AND estado = 'ACTIVO'
     ON CONFLICT (id_beneficiario, id_requisito) DO NOTHING`,
    [idBeneficiario]
  );
}

async function esDelPropietario(idBeneficiario: number, idUsuario: number): Promise<boolean> {
  const r = await pool.query(
    "SELECT 1 FROM beneficiario WHERE id_beneficiario = $1 AND id_usuario_propietario = $2 AND estado = 'ACTIVO'",
    [idBeneficiario, idUsuario]
  );
  return r.rows.length > 0;
}

// Todo el catálogo vigente, marcando cuáles tiene asignados este heredero
export async function documentosDeHeredero(idBeneficiario: number, idUsuario: number) {
  if (!(await esDelPropietario(idBeneficiario, idUsuario))) throw new ReglaDocumento('Heredero no encontrado', 404);

  const r = await pool.query(
    `SELECT r.id_requisito AS id, r.nombre, r.descripcion, r.obligatorio,
            (d.id_documento IS NOT NULL) AS asignado, d.estado, d.ubicacion
     FROM requisito_documental r
     LEFT JOIN documento_heredero d ON d.id_requisito = r.id_requisito AND d.id_beneficiario = $1
     WHERE r.estado = 'ACTIVO'
     ORDER BY r.obligatorio DESC, r.nombre`,
    [idBeneficiario]
  );
  return r.rows;
}

export type ItemDocumento = { idRequisito: number; ubicacion: string | null };

// Reemplaza los requisitos del heredero. Los obligatorios no se pueden quitar.
export async function guardarDocumentosDeHeredero(idBeneficiario: number, idUsuario: number, items: ItemDocumento[]) {
  if (!(await esDelPropietario(idBeneficiario, idUsuario))) throw new ReglaDocumento('Heredero no encontrado', 404);

  const vigentes = await pool.query("SELECT id_requisito, obligatorio FROM requisito_documental WHERE estado = 'ACTIVO'");
  const idsVigentes = new Set(vigentes.rows.map(r => r.id_requisito));
  if (items.some(i => !idsVigentes.has(i.idRequisito))) throw new ReglaDocumento('Alguno de los documentos no existe', 400);

  // Se agregan los obligatorios aunque no vengan marcados
  const elegidos = new Map<number, string | null>(items.map(i => [i.idRequisito, i.ubicacion]));
  for (const r of vigentes.rows) {
    if (r.obligatorio && !elegidos.has(r.id_requisito)) elegidos.set(r.id_requisito, null);
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    await cliente.query(
      'DELETE FROM documento_heredero WHERE id_beneficiario = $1 AND NOT (id_requisito = ANY($2::int[]))',
      [idBeneficiario, [...elegidos.keys()]]
    );
    for (const [idRequisito, ubicacion] of elegidos) {
      await cliente.query(
        `INSERT INTO documento_heredero (id_beneficiario, id_requisito, ubicacion) VALUES ($1, $2, $3)
         ON CONFLICT (id_beneficiario, id_requisito) DO UPDATE SET ubicacion = EXCLUDED.ubicacion`,
        [idBeneficiario, idRequisito, ubicacion]
      );
    }

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'EDITAR_DOCUMENTOS_HEREDERO', 'beneficiario', $2, $3)`,
      [idUsuario, idBeneficiario, `Documentos del heredero actualizados: ${elegidos.size}`]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// ---------------------------------------------------------------
// HEREDERO: portal
// ---------------------------------------------------------------

// El heredero se identifica por su correo (ya verificado). Si es heredero de varias personas, ve todas sus listas.
export async function checklistDelHeredero(correo: string) {
  const r = await pool.query(
    `SELECT b.id_beneficiario AS "idBeneficiario", b.nombres, b.apellidos,
            u.nombres || ' ' || u.apellidos AS benefactor,
            d.id_documento AS id, q.nombre, q.descripcion, q.obligatorio, d.estado, d.ubicacion
     FROM beneficiario b
     JOIN usuario u ON u.id_usuario = b.id_usuario_propietario
     JOIN documento_heredero d ON d.id_beneficiario = b.id_beneficiario
     JOIN requisito_documental q ON q.id_requisito = d.id_requisito AND q.estado = 'ACTIVO'
     WHERE LOWER(b.correo) = $1 AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE
     ORDER BY b.id_beneficiario, q.obligatorio DESC, q.nombre`,
    [correo]
  );

  // Se agrupa por benefactor: una tarjeta por persona que lo designó
  const grupos = new Map<number, any>();
  for (const f of r.rows) {
    if (!grupos.has(f.idBeneficiario)) {
      grupos.set(f.idBeneficiario, {
        idBeneficiario: f.idBeneficiario,
        heredero: `${f.nombres} ${f.apellidos}`,
        benefactor: f.benefactor,
        documentos: []
      });
    }
    grupos.get(f.idBeneficiario).documentos.push({
      id: f.id, nombre: f.nombre, descripcion: f.descripcion,
      obligatorio: f.obligatorio, estado: f.estado, ubicacion: f.ubicacion
    });
  }
  return [...grupos.values()];
}

// El heredero marca (o desmarca) que ya tiene un documento. Solo puede tocar los suyos.
export async function marcarDocumento(idDocumento: number, correo: string, entregado: boolean): Promise<boolean> {
  const r = await pool.query(
    `UPDATE documento_heredero d
     SET estado = $3::varchar, fecha_entrega = CASE WHEN $3::varchar = 'ENTREGADO' THEN NOW() ELSE NULL END
     FROM beneficiario b
     WHERE d.id_documento = $1 AND b.id_beneficiario = d.id_beneficiario
       AND LOWER(b.correo) = $2 AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE
     RETURNING d.id_documento, d.id_beneficiario`,
    [idDocumento, correo, entregado ? 'ENTREGADO' : 'PENDIENTE']
  );
  if (r.rows.length === 0) return false;

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
     VALUES (NULL, 'MARCAR_DOCUMENTO_HEREDERO', 'documento_heredero', $1, $2)`,
    [idDocumento, `El heredero ${correo} marcó un documento como ${entregado ? 'entregado' : 'pendiente'}`]
  );
  return true;
}
