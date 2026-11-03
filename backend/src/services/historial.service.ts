// Historial del propio usuario: sus acciones (auditoría) y sus ingresos al sistema.

import { pool } from '../config/database';

export async function listarHistorial(idUsuario: number) {
  const resultado = await pool.query(
    `SELECT fecha, accion, descripcion, ip_origen AS "ipOrigen"
     FROM (
       SELECT fecha, accion, descripcion, ip_origen
       FROM auditoria
       WHERE id_usuario = $1
       UNION ALL
       SELECT fecha_actividad AS fecha, tipo_evento AS accion, NULL AS descripcion, ip_origen
       FROM actividad_usuario
       WHERE id_usuario = $1
     ) AS todo
     ORDER BY fecha DESC
     LIMIT 100`,
    [idUsuario]
  );
  return resultado.rows;
}
