// Servicio de procesos de liberación. Todo se filtra por el dueño del proceso (el usuario con sesión).

import { pool } from '../config/database';
import { ProcesoDetalle, ProcesoResumen } from '../models/proceso.model';

const RESUMEN = `
  SELECT p.id_proceso AS id, p.estado, p.motivo,
         p.fecha_inicio AS "fechaInicio", p.fecha_fin AS "fechaFin",
         r.min_confirmaciones AS "minConfirmaciones",
         r.dias_periodo_espera AS "diasPeriodoEspera",
         (SELECT COUNT(*)::int FROM proceso_activo pa WHERE pa.id_proceso = p.id_proceso) AS activos,
         (SELECT COUNT(DISTINCT c.id_beneficiario)::int FROM confirmacion_beneficiario c
            WHERE c.id_proceso = p.id_proceso AND c.resultado = 'CONFIRMADA') AS confirmaciones,
         (SELECT COUNT(*)::int FROM objecion o
            WHERE o.id_proceso = p.id_proceso AND o.estado = 'ABIERTA') AS objeciones
  FROM proceso_liberacion p
  JOIN regla_liberacion r ON r.id_regla = p.id_regla`;

export async function listarProcesos(idUsuario: number): Promise<ProcesoResumen[]> {
  const r = await pool.query<ProcesoResumen>(
    `${RESUMEN} WHERE p.id_usuario_propietario = $1 ORDER BY p.fecha_inicio DESC`,
    [idUsuario]
  );
  return r.rows;
}

// Devuelve null si el proceso no existe o no pertenece al usuario.
export async function obtenerProceso(idProceso: number, idUsuario: number): Promise<ProcesoDetalle | null> {
  const base = await pool.query<ProcesoResumen>(
    `${RESUMEN} WHERE p.id_proceso = $1 AND p.id_usuario_propietario = $2`,
    [idProceso, idUsuario]
  );
  if (!base.rows[0]) return null;

  const [activos, confirmaciones, objeciones, entregas] = await Promise.all([
    pool.query(
      `SELECT a.nombre, t.nombre AS tipo, t.categoria_sensibilidad AS sensibilidad, pa.estado
       FROM proceso_activo pa
       JOIN activo_digital a ON a.id_activo = pa.id_activo
       JOIN tipo_activo t ON t.id_tipo = a.id_tipo
       WHERE pa.id_proceso = $1 ORDER BY a.nombre`, [idProceso]),
    pool.query(
      `SELECT b.nombres || ' ' || b.apellidos AS beneficiario, a.nombre AS activo, c.resultado, c.fecha
       FROM confirmacion_beneficiario c
       JOIN beneficiario b ON b.id_beneficiario = c.id_beneficiario
       JOIN activo_digital a ON a.id_activo = c.id_activo
       WHERE c.id_proceso = $1 ORDER BY b.nombres, a.nombre`, [idProceso]),
    pool.query(
      `SELECT COALESCE(b.nombres || ' ' || b.apellidos, 'Propietario') AS autor, o.motivo, o.estado, o.fecha
       FROM objecion o
       LEFT JOIN beneficiario b ON b.id_beneficiario = o.id_beneficiario
       WHERE o.id_proceso = $1 ORDER BY o.fecha DESC`, [idProceso]),
    pool.query(
      `SELECT a.nombre AS activo, b.nombres || ' ' || b.apellidos AS beneficiario,
              e.estado, e.fecha_acceso AS "fechaAcceso"
       FROM entrega e
       JOIN activo_digital a ON a.id_activo = e.id_activo
       JOIN beneficiario b ON b.id_beneficiario = e.id_beneficiario
       WHERE e.id_proceso = $1 ORDER BY a.nombre`, [idProceso])
  ]);

  return {
    ...base.rows[0],
    activosIncluidos: activos.rows,
    confirmacionesDetalle: confirmaciones.rows,
    objeccionesDetalle: objeciones.rows,
    entregas: entregas.rows
  };
}

// El dueño reapareció: se cancela el proceso y queda registrado en la auditoría.
// Devuelve false si no existe, no es suyo o ya terminó.
export async function cancelarProceso(idProceso: number, idUsuario: number): Promise<boolean> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const r = await cliente.query(
      `UPDATE proceso_liberacion
       SET estado = 'CANCELADO', fecha_fin = NOW()
       WHERE id_proceso = $1 AND id_usuario_propietario = $2 AND fecha_fin IS NULL
       RETURNING id_proceso`,
      [idProceso, idUsuario]
    );

    if (r.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return false;
    }

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'CANCELAR_PROCESO', 'proceso_liberacion', $2, 'El propietario canceló el proceso de liberación')`,
      [idUsuario, idProceso]
    );

    await cliente.query('COMMIT');
    return true;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
