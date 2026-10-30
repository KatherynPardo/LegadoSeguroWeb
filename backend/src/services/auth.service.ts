// Servicio de autenticación: valida correo y contraseña, registra usuarios y entrega una sesión (JWT).

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { JWT_SECRET } from '../config/env';

export type Sesion = {
  token: string;
  usuario: { id: number; nombres: string; apellidos: string; correo: string; rol: string };
};

export type NuevoUsuario = {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string | null;
  password: string;
};

function crearSesion(u: { id_usuario: number; nombres: string; apellidos: string; correo: string; rol: string }): Sesion {
  // El token lleva el id del usuario y vence en 8 horas
  const token = jwt.sign({ id: u.id_usuario }, JWT_SECRET, { expiresIn: '8h' });
  return {
    token,
    usuario: { id: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, rol: u.rol }
  };
}

export async function iniciarSesion(correo: string, password: string): Promise<Sesion | null> {
  const resultado = await pool.query(
    `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.password_hash, r.nombre AS rol
     FROM usuario u
     JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.correo = $1 AND u.estado = 'ACTIVO'`,
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

  return crearSesion(usuario);
}

// Crea una cuenta nueva con rol PROPIETARIO. Devuelve null si el correo o el DNI ya existen.
export async function registrarUsuario(datos: NuevoUsuario): Promise<Sesion | null> {
  const existe = await pool.query(
    'SELECT 1 FROM usuario WHERE correo = $1 OR dni = $2',
    [datos.correo, datos.dni]
  );
  if (existe.rows.length > 0) return null;

  const hash = await bcrypt.hash(datos.password, 10);

  const resultado = await pool.query(
    `INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono)
     VALUES ((SELECT id_rol FROM rol WHERE nombre = 'PROPIETARIO'), $1, $2, $3, $4, $5, $6)
     RETURNING id_usuario, nombres, apellidos, correo`,
    [datos.nombres, datos.apellidos, datos.dni, datos.correo, hash, datos.telefono]
  );

  await pool.query(
    `INSERT INTO actividad_usuario (id_usuario, tipo_evento) VALUES ($1, 'REGISTRO')`,
    [resultado.rows[0].id_usuario]
  );

  return crearSesion({ ...resultado.rows[0], rol: 'PROPIETARIO' });
}
