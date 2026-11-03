// Planes y suscripción del usuario. Si no tiene ninguna suscripción activa, está en el plan Gratuito.

import { pool } from '../config/database';

// Cuántos herederos permite el plan actual del usuario (null = sin límite)
export async function limiteDeHerederos(idUsuario: number): Promise<number | null> {
  const plan = await pool.query(
    `SELECT p.limite_herederos AS limite
     FROM suscripcion s JOIN plan p ON p.id_plan = s.id_plan
     WHERE s.id_usuario = $1 AND s.estado = 'ACTIVA'
     ORDER BY s.fecha_inicio DESC LIMIT 1`,
    [idUsuario]
  );
  if (plan.rows.length > 0) return plan.rows[0].limite;

  // Sin suscripción registrada = plan gratuito
  const gratuito = await pool.query("SELECT limite_herederos AS limite FROM plan WHERE tipo = 'FREE' AND estado = 'ACTIVO' LIMIT 1");
  return gratuito.rows[0]?.limite ?? null;
}

export async function obtenerSuscripcion(idUsuario: number) {
  const planes = await pool.query(
    `SELECT id_plan AS id, nombre, tipo, precio::float8 AS precio, descripcion,
            limite_herederos AS "limiteHerederos"
     FROM plan WHERE estado = 'ACTIVO' ORDER BY precio`
  );

  const actual = await pool.query(
    `SELECT s.id_suscripcion AS id, s.id_plan AS "idPlan", s.fecha_inicio AS desde
     FROM suscripcion s
     WHERE s.id_usuario = $1 AND s.estado = 'ACTIVA'
     ORDER BY s.fecha_inicio DESC LIMIT 1`,
    [idUsuario]
  );

  // Sin suscripción registrada = plan gratuito
  const gratuito = planes.rows.find(p => p.tipo === 'FREE');
  const idPlanActual = actual.rows[0]?.idPlan ?? gratuito?.id ?? null;

  const uso = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM activo_digital WHERE id_usuario = $1 AND estado = 'ACTIVO') AS activos,
       (SELECT COUNT(*)::int FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO') AS beneficiarios`,
    [idUsuario]
  );

  const pagos = await pool.query(
    `SELECT p.fecha_pago AS fecha, p.monto::float8 AS monto, p.estado, pl.nombre AS plan
     FROM pago p
     JOIN suscripcion s ON s.id_suscripcion = p.id_suscripcion
     JOIN plan pl ON pl.id_plan = s.id_plan
     WHERE s.id_usuario = $1
     ORDER BY p.fecha_pago DESC`,
    [idUsuario]
  );

  return {
    idPlanActual,
    desde: actual.rows[0]?.desde ?? null,
    limiteHerederos: await limiteDeHerederos(idUsuario),
    planes: planes.rows,
    uso: uso.rows[0],
    pagos: pagos.rows
  };
}

// Cambia al plan indicado. Por ahora solo se puede volver al gratuito: los planes de pago
// necesitan cobrar con Culqi, que todavía no está conectado.
export async function cambiarPlan(idPlan: number, idUsuario: number, ip: string | null): Promise<string | null> {
  const plan = await pool.query(
    "SELECT id_plan, nombre, precio::float8 AS precio FROM plan WHERE id_plan = $1 AND estado = 'ACTIVO'",
    [idPlan]
  );
  if (plan.rows.length === 0) return 'El plan no existe';
  if (plan.rows[0].precio > 0) return 'El pago de este plan estará disponible cuando se conecte Culqi';

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      "UPDATE suscripcion SET estado = 'CANCELADA', fecha_fin = NOW() WHERE id_usuario = $1 AND estado = 'ACTIVA'",
      [idUsuario]
    );
    const nueva = await cliente.query(
      'INSERT INTO suscripcion (id_usuario, id_plan) VALUES ($1, $2) RETURNING id_suscripcion',
      [idUsuario, idPlan]
    );
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
       VALUES ($1, 'CAMBIAR_PLAN', 'suscripcion', $2, $3, $4)`,
      [idUsuario, nueva.rows[0].id_suscripcion, `Plan cambiado a ${plan.rows[0].nombre}`, ip]
    );
    await cliente.query('COMMIT');
    return null;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
