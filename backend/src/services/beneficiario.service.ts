// Servicio: aquí viven las consultas SQL. No sabe nada de HTTP (req/res).
// "Eliminar" un heredero lo marca INACTIVO para no romper el historial de los procesos.

import { pool } from '../config/database';
import { Beneficiario, EdicionBeneficiario, NuevoBeneficiario } from '../models/beneficiario.model';
import { enviarCodigo, validarCodigo } from './verificacion.service';

// Envía al correo del heredero el código que el dueño tendrá que escribir para registrarlo
export async function enviarCodigoHeredero(correo: string, idUsuario: number): Promise<void> {
  const dueno = await pool.query('SELECT nombres, apellidos FROM usuario WHERE id_usuario = $1', [idUsuario]);
  const nombre = `${dueno.rows[0].nombres} ${dueno.rows[0].apellidos}`;

  await enviarCodigo(
    'HEREDERO',
    correo,
    idUsuario,
    `${nombre} quiere registrarte como heredero en LegadoSeguro. Si estás de acuerdo, entrégale este código.`
  );
}

// Errores de regla de negocio: el controlador los convierte en 404 o 409
export class ReglaHeredero extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

export async function listarBeneficiarios(idUsuario: number): Promise<Beneficiario[]> {
  const resultado = await pool.query<Beneficiario>(
    `SELECT id_beneficiario AS id, nombres, apellidos, dni, parentesco, correo, telefono,
            correo_verificado AS verificado
     FROM beneficiario
     WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'
     ORDER BY id_beneficiario`,
    [idUsuario]
  );
  return resultado.rows;
}

export async function crearBeneficiario(datos: NuevoBeneficiario, idUsuario: number): Promise<number> {
  const repetido = await pool.query(
    "SELECT 1 FROM beneficiario WHERE id_usuario_propietario = $1 AND dni = $2 AND estado = 'ACTIVO'",
    [idUsuario, datos.dni]
  );
  if (repetido.rows.length > 0) throw new ReglaHeredero('Ya registraste un heredero con ese DNI', 409);

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
  return resultado.rows[0].id;
}

export async function actualizarBeneficiario(id: number, datos: EdicionBeneficiario, idUsuario: number): Promise<void> {
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
