// Servicio de autenticación: valida correo y contraseña y entrega una sesión (JWT).

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { JWT_SECRET } from '../config/env';

export type Sesion = {
  token: string;
  usuario: { id: number; nombres: string; apellidos: string; correo: string };
};

export async function iniciarSesion(correo: string, password: string): Promise<Sesion | null> {
  const resultado = await pool.query(
    `SELECT id_usuario, nombres, apellidos, correo, password_hash
     FROM usuario
     WHERE correo = $1 AND estado = 'ACTIVO'`,
    [correo]
  );

  const usuario = resultado.rows[0];
  if (!usuario) return null;

  // Se compara la contraseña escrita con el hash guardado (nunca se guarda la contraseña real)
  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) return null;

  // Cada inicio de sesión cuenta como actividad: es lo que mira el monitoreo de inactividad
  await pool.query(
    `INSERT INTO actividad_usuario (id_usuario, tipo_evento) VALUES ($1, 'INICIO_SESION')`,
    [usuario.id_usuario]
  );

  // El token lleva el id del usuario y vence en 8 horas
  const token = jwt.sign({ id: usuario.id_usuario }, JWT_SECRET, { expiresIn: '8h' });

  return {
    token,
    usuario: {
      id: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo
    }
  };
}
