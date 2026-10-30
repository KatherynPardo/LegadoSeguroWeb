// Monitoreo de inactividad: el "paso 1" de la regla de liberación.
// Revisa a cada usuario con una regla activa y, si pasaron más días sin actividad que los de su regla
// (y no tiene ya un proceso abierto), inicia el proceso de liberación.

import { pool } from '../config/database';

type Detectado = { id_regla: number; id_usuario: number; dias_inactividad: number };

export async function detectarInactividad(): Promise<number> {
  // Última actividad = último registro de actividad_usuario (o, si no hay, la fecha de registro)
  const candidatos = await pool.query<Detectado>(
    `SELECT r.id_regla, r.id_usuario, r.dias_inactividad
     FROM regla_liberacion r
     JOIN usuario u ON u.id_usuario = r.id_usuario
     WHERE r.estado = 'ACTIVA'
       AND u.estado = 'ACTIVO'
       AND NOT EXISTS (
         SELECT 1 FROM proceso_liberacion p
         WHERE p.id_usuario_propietario = r.id_usuario AND p.fecha_fin IS NULL
       )
       AND COALESCE(
             (SELECT MAX(a.fecha_actividad) FROM actividad_usuario a WHERE a.id_usuario = r.id_usuario),
             u.fecha_registro
           ) < NOW() - make_interval(days => r.dias_inactividad)`
  );

  for (const c of candidatos.rows) {
    await iniciarProceso(c);
  }
  return candidatos.rows.length;
}

async function iniciarProceso(c: Detectado): Promise<void> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const proceso = await cliente.query(
      `INSERT INTO proceso_liberacion (id_usuario_propietario, id_regla, estado, motivo)
       VALUES ($1, $2, 'DETECTADO', $3)
       RETURNING id_proceso`,
      [c.id_usuario, c.id_regla, `Inactividad superior a ${c.dias_inactividad} días`]
    );
    const idProceso = proceso.rows[0].id_proceso;

    // Entran al proceso todos los activos vigentes del usuario
    await cliente.query(
      `INSERT INTO proceso_activo (id_proceso, id_activo, estado)
       SELECT $1, id_activo, 'PENDIENTE' FROM activo_digital WHERE id_usuario = $2 AND estado = 'ACTIVO'`,
      [idProceso, c.id_usuario]
    );

    // Cada beneficiario asignado a un activo debe confirmar por ese activo
    await cliente.query(
      `INSERT INTO confirmacion_beneficiario (id_proceso, id_activo, id_beneficiario)
       SELECT $1, ab.id_activo, ab.id_beneficiario
       FROM activo_beneficiario ab
       JOIN activo_digital a ON a.id_activo = ab.id_activo
       WHERE a.id_usuario = $2 AND a.estado = 'ACTIVO' AND ab.estado = 'ACTIVO'`,
      [idProceso, c.id_usuario]
    );

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'INICIAR_PROCESO', 'proceso_liberacion', $2, $3)`,
      [c.id_usuario, idProceso, `El sistema detectó inactividad de más de ${c.dias_inactividad} días`]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
