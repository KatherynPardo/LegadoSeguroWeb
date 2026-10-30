// Servicio: consulta de activos digitales, con el nombre de su tipo (JOIN con tipo_activo).

import { pool } from '../config/database';
import { USUARIO_TEMPORAL } from '../config/usuario-temporal';
import { Activo, NuevoActivo } from '../models/activo.model';

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

export async function crearActivo(datos: NuevoActivo): Promise<number> {
  const resultado = await pool.query(
    `INSERT INTO activo_digital (id_usuario, id_tipo, nombre, descripcion)
     VALUES ($1, $2, $3, $4)
     RETURNING id_activo AS id`,
    [USUARIO_TEMPORAL, datos.id_tipo, datos.nombre, datos.descripcion ?? null]
  );
  return resultado.rows[0].id;
}
