// Servicio: lista los tipos de activo con su sensibilidad.

import { pool } from '../config/database';
import { TipoActivo } from '../models/tipo-activo.model';

export async function listarTipos(): Promise<TipoActivo[]> {
  const resultado = await pool.query<TipoActivo>(
    `SELECT id_tipo AS id, nombre, categoria_sensibilidad AS sensibilidad
     FROM tipo_activo
     ORDER BY id_tipo`
  );
  return resultado.rows;
}
