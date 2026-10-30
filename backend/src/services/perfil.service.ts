// Servicio del perfil: consulta y actualiza los datos del propio usuario.

import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { ActualizarPerfil, Perfil } from '../models/perfil.model';

export async function obtenerPerfil(idUsuario: number): Promise<Perfil | null> {
  const resultado = await pool.query<Perfil>(
    `SELECT id_usuario AS id, nombres, apellidos, dni, correo, telefono
     FROM usuario
     WHERE id_usuario = $1`,
    [idUsuario]
  );
  return resultado.rows[0] ?? null;
}

export async function actualizarPerfil(datos: ActualizarPerfil, idUsuario: number): Promise<Perfil | null> {
  const resultado = await pool.query<Perfil>(
    `UPDATE usuario
     SET nombres = $1, apellidos = $2, correo = $3, telefono = $4
     WHERE id_usuario = $5
     RETURNING id_usuario AS id, nombres, apellidos, dni, correo, telefono`,
    [datos.nombres, datos.apellidos, datos.correo, datos.telefono || null, idUsuario]
  );
  return resultado.rows[0] ?? null;
}

// Devuelve false si la contraseña actual no coincide.
export async function cambiarPassword(actual: string, nueva: string, idUsuario: number): Promise<boolean> {
  const fila = await pool.query('SELECT password_hash FROM usuario WHERE id_usuario = $1', [idUsuario]);
  if (!fila.rows[0]) return false;

  const coincide = await bcrypt.compare(actual, fila.rows[0].password_hash);
  if (!coincide) return false;

  const nuevoHash = await bcrypt.hash(nueva, 10);
  await pool.query('UPDATE usuario SET password_hash = $1 WHERE id_usuario = $2', [nuevoHash, idUsuario]);
  return true;
}
