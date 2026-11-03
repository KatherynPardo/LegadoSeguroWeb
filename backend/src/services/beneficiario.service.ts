// Servicio: aquí viven las consultas SQL. No sabe nada de HTTP (req/res).
// "Eliminar" un heredero lo marca INACTIVO para no romper el historial de los procesos.

import { pool } from '../config/database';
import { Beneficiario, EdicionBeneficiario, NuevoBeneficiario } from '../models/beneficiario.model';
import { enviarCodigo, validarCodigo } from './verificacion.service';
import { limiteDeHerederos } from './suscripcion.service';
import { enFila } from '../utils/bloqueo';

// Envía al correo del heredero el código que el dueño tendrá que escribir para registrarlo
export async function enviarCodigoHeredero(correo: string, idUsuario: number): Promise<void> {
  await revisarLimite(idUsuario);

  const dueno = await pool.query('SELECT nombres, apellidos FROM usuario WHERE id_usuario = $1', [idUsuario]);
  const nombre = `${dueno.rows[0].nombres} ${dueno.rows[0].apellidos}`;

  await enviarCodigo(
    'HEREDERO',
    correo,
    idUsuario,
    `${nombre} quiere registrarte como heredero en LegadoSeguro. Si estás de acuerdo, entrégale este código.`
  );
}

// Errores de regla de negocio: el controlador los convierte en 404, 409 o 403.
// El código 'LIMITE_PLAN' le avisa al frontend que debe ofrecer cambiar de plan.
export class ReglaHeredero extends Error {
  constructor(mensaje: string, public estado: number, public codigo?: string, public limite?: number) {
    super(mensaje);
  }
}

// Si el plan tiene límite de herederos y ya se alcanzó, no se deja registrar otro
async function revisarLimite(idUsuario: number): Promise<void> {
  const limite = await limiteDeHerederos(idUsuario);
  if (limite === null) return;

  const cuenta = await pool.query(
    "SELECT COUNT(*)::int AS n FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'",
    [idUsuario]
  );
  if (cuenta.rows[0].n >= limite) {
    throw new ReglaHeredero(`Tu plan permite hasta ${limite} herederos`, 403, 'LIMITE_PLAN', limite);
  }
}

// Comprueba que los activos elegidos existen y son del propietario
async function validarActivosPropios(ids: number[], idUsuario: number): Promise<void> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return;

  const r = await pool.query(
    "SELECT id_activo FROM activo_digital WHERE id_usuario = $1 AND estado = 'ACTIVO' AND id_activo = ANY($2::int[])",
    [idUsuario, unicos]
  );
  if (r.rows.length !== unicos.length) throw new ReglaHeredero('Alguno de los activos no existe', 400);
}

// Deja al heredero recibiendo exactamente los activos elegidos (de los activos de este propietario)
async function asignarActivosAHeredero(idBeneficiario: number, ids: number[], idUsuario: number): Promise<void> {
  const unicos = [...new Set(ids)];
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      'DELETE FROM activo_beneficiario WHERE id_beneficiario = $1 AND id_activo IN (SELECT id_activo FROM activo_digital WHERE id_usuario = $2)',
      [idBeneficiario, idUsuario]
    );
    for (const idActivo of unicos) {
      await cliente.query(
        `INSERT INTO activo_beneficiario (id_activo, id_beneficiario, prioridad)
         VALUES ($1, $2, (SELECT COALESCE(MAX(prioridad), 0) + 1 FROM activo_beneficiario WHERE id_activo = $1))`,
        [idActivo, idBeneficiario]
      );
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export async function listarBeneficiarios(idUsuario: number): Promise<Beneficiario[]> {
  const resultado = await pool.query<Beneficiario>(
    `SELECT id_beneficiario AS id, nombres, apellidos, dni, parentesco, correo, telefono,
            correo_verificado AS verificado,
            COALESCE((SELECT json_agg(json_build_object('id', a.id_activo, 'nombre', a.nombre) ORDER BY a.nombre)
                      FROM activo_beneficiario ab JOIN activo_digital a ON a.id_activo = ab.id_activo
                      WHERE ab.id_beneficiario = beneficiario.id_beneficiario AND ab.estado = 'ACTIVO' AND a.estado = 'ACTIVO'), '[]') AS activos
     FROM beneficiario
     WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'
     ORDER BY id_beneficiario`,
    [idUsuario]
  );
  return resultado.rows;
}

// Los pedidos de un mismo propietario se atienden uno por uno: así un doble clic no crea dos herederos
export function crearBeneficiario(datos: NuevoBeneficiario, idUsuario: number): Promise<number> {
  return enFila(idUsuario, () => crearBeneficiarioSeguro(datos, idUsuario));
}

async function crearBeneficiarioSeguro(datos: NuevoBeneficiario, idUsuario: number): Promise<number> {
  await revisarLimite(idUsuario);

  const repetido = await pool.query(
    "SELECT 1 FROM beneficiario WHERE id_usuario_propietario = $1 AND dni = $2 AND estado = 'ACTIVO'",
    [idUsuario, datos.dni]
  );
  if (repetido.rows.length > 0) throw new ReglaHeredero('Ya registraste un heredero con ese DNI', 409);

  await validarActivosPropios(datos.activos, idUsuario);

  // El heredero tiene que haber recibido el código en su correo: así nadie registra un correo ajeno
  const codigoOk = await validarCodigo('HEREDERO', datos.correo, datos.codigo);
  if (!codigoOk) throw new ReglaHeredero('El código es incorrecto o ya venció', 400);

  const resultado = await pool.query(
    `INSERT INTO beneficiario
       (id_usuario_propietario, nombres, apellidos, dni, correo, telefono, parentesco, correo_verificado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
     RETURNING id_beneficiario AS id`,
    [idUsuario, datos.nombres, datos.apellidos, datos.dni, datos.correo, datos.telefono, datos.parentesco]
  );
  await asignarActivosAHeredero(resultado.rows[0].id, datos.activos, idUsuario);

  return resultado.rows[0].id;
}

export async function actualizarBeneficiario(id: number, datos: EdicionBeneficiario, idUsuario: number): Promise<void> {
  if (datos.activos !== null) await validarActivosPropios(datos.activos, idUsuario);
  const actual = await pool.query(
    "SELECT correo, correo_verificado FROM beneficiario WHERE id_beneficiario = $1 AND id_usuario_propietario = $2 AND estado = 'ACTIVO'",
    [id, idUsuario]
  );
  if (actual.rows.length === 0) throw new ReglaHeredero('Heredero no encontrado', 404);

  // Si cambia el correo, o el correo todavía no está verificado, hace falta el código
  const pideCodigo = actual.rows[0].correo !== datos.correo || !actual.rows[0].correo_verificado;
  if (pideCodigo) {
    const codigoOk = datos.codigo ? await validarCodigo('HEREDERO', datos.correo, datos.codigo) : false;
    if (!codigoOk) throw new ReglaHeredero('Ingresa el código que le llegó al correo del heredero para verificarlo', 400);
  }

  const resultado = await pool.query(
    `UPDATE beneficiario
     SET nombres = $1, apellidos = $2, correo = $3, telefono = $4, parentesco = $5,
         correo_verificado = TRUE
     WHERE id_beneficiario = $6 AND id_usuario_propietario = $7 AND estado = 'ACTIVO'
     RETURNING id_beneficiario`,
    [datos.nombres, datos.apellidos, datos.correo, datos.telefono, datos.parentesco, id, idUsuario]
  );
  if (resultado.rows.length === 0) throw new ReglaHeredero('Heredero no encontrado', 404);

  if (datos.activos !== null) await asignarActivosAHeredero(id, datos.activos, idUsuario);
}

// Quita al heredero de la lista y de todos los activos. No se puede si tiene una confirmación pendiente
// en un proceso de liberación abierto.
export async function eliminarBeneficiario(id: number, idUsuario: number): Promise<void> {
  const enProceso = await pool.query(
    `SELECT 1 FROM confirmacion_beneficiario c
     JOIN proceso_liberacion p ON p.id_proceso = c.id_proceso
     WHERE c.id_beneficiario = $1 AND p.fecha_fin IS NULL`,
    [id]
  );
  if (enProceso.rows.length > 0) {
    throw new ReglaHeredero('El heredero participa en un proceso de liberación abierto. Cancela el proceso primero.', 409);
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `UPDATE beneficiario SET estado = 'INACTIVO'
       WHERE id_beneficiario = $1 AND id_usuario_propietario = $2 AND estado = 'ACTIVO'
       RETURNING nombres, apellidos`,
      [id, idUsuario]
    );
    if (resultado.rows.length === 0) throw new ReglaHeredero('Heredero no encontrado', 404);

    await cliente.query('DELETE FROM activo_beneficiario WHERE id_beneficiario = $1', [id]);

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'ELIMINAR_HEREDERO', 'beneficiario', $2, $3)`,
      [idUsuario, id, `Heredero eliminado: ${resultado.rows[0].nombres} ${resultado.rows[0].apellidos}`]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
