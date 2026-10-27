// Servicio: consulta de activos digitales, con el nombre de su tipo (JOIN con tipo_activo).

import { pool } from '../config/database';
import { Activo } from '../models/activo.model';

export async function listarActivos(): Promise<Activo[]> {
  const resultado = await pool.query<Activo>(
    `SELECT a.id_activo AS id, a.nombre, a.descripcion,
            t.nombre AS tipo, t.categoria_sensibilidad AS sensibilidad, a.estado
     FROM activo_digital a
     JOIN tipo_activo t ON t.id_tipo = a.id_tipo
     ORDER BY a.id_activo`
  );
  return resultado.rows;
}
