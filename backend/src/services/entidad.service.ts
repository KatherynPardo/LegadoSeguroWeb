// Servicio: catálogo de bancos. Los de fábrica los ve todo el mundo; los que crea un usuario, solo él.

import { pool } from '../config/database';
import { Entidad } from '../models/entidad.model';

export async function listarEntidades(idUsuario: number): Promise<Entidad[]> {
  const resultado = await pool.query<Entidad>(
    `SELECT id_entidad AS id, nombre
     FROM entidad_financiera
     WHERE estado = 'ACTIVO' AND (id_usuario_creador IS NULL OR id_usuario_creador = $1)
     ORDER BY nombre`,
    [idUsuario]
  );
  return resultado.rows;
}

// Devuelve null si ya existe un banco con ese nombre (sin distinguir mayúsculas)
export async function crearEntidad(nombre: string, idUsuario: number): Promise<Entidad | null> {
  const existe = await pool.query(
    "SELECT 1 FROM entidad_financiera WHERE LOWER(nombre) = LOWER($1)",
    [nombre]
  );
  if (existe.rows.length > 0) return null;

  const resultado = await pool.query<Entidad>(
    `INSERT INTO entidad_financiera (nombre, id_usuario_creador) VALUES ($1, $2)
     RETURNING id_entidad AS id, nombre`,
    [nombre, idUsuario]
  );
  return resultado.rows[0];
}
