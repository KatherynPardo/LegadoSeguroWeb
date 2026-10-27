// Servicio de salud: pregunta la hora a la base de datos para comprobar la conexión.

import { pool } from '../config/database';

export async function horaDeLaBaseDeDatos(): Promise<string> {
  const resultado = await pool.query('SELECT NOW() AS hora_bd');
  return resultado.rows[0].hora_bd;
}
