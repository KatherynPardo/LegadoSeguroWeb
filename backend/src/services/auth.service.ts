// Servicio de autenticación: valida correo y contraseña, registra usuarios y entrega una sesión (JWT).

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { JWT_SECRET } from '../config/env';
import { enviarCodigo, validarCodigo } from './verificacion.service';

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

export async function iniciarSesion(correo: string, password: string, ip: string | null): Promise<Sesion | null> {
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
    `INSERT INTO actividad_usuario (id_usuario, tipo_evento, ip_origen) VALUES ($1, 'INICIO_SESION', $2)`,
    [usuario.id_usuario, ip]
  );

  return crearSesion(usuario);
}

// Paso 1 del registro: guarda la cuenta como PENDIENTE y envía un código al correo.
// Devuelve false si el correo o el DNI ya pertenecen a una cuenta confirmada.
export async function registrarUsuario(datos: NuevoUsuario, ip: string | null): Promise<boolean> {
  const existe = await pool.query(
    "SELECT 1 FROM usuario WHERE (correo = $1 OR dni = $2) AND estado <> 'PENDIENTE'",
    [datos.correo, datos.dni]
  );
  if (existe.rows.length > 0) return false;

  // Si alguien empezó el registro y nunca confirmó, se descarta esa cuenta pendiente y se crea de nuevo
  await pool.query("DELETE FROM usuario WHERE (correo = $1 OR dni = $2) AND estado = 'PENDIENTE'", [datos.correo, datos.dni]);

  const hash = await bcrypt.hash(datos.password, 10);

  const resultado = await pool.query(
    `INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono, ip_registro, estado)
     VALUES ((SELECT id_rol FROM rol WHERE nombre = 'PROPIETARIO'), $1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')
     RETURNING id_usuario`,
    [datos.nombres, datos.apellidos, datos.dni, datos.correo, hash, datos.telefono, ip]
  );

  await enviarCodigo('REGISTRO', datos.correo, resultado.rows[0].id_usuario, 'Usa este código para confirmar tu correo y activar tu cuenta.');
  return true;
}

// Reenvía el código a una cuenta que todavía está PENDIENTE
export async function reenviarCodigoRegistro(correo: string): Promise<boolean> {
  const usuario = await pool.query("SELECT id_usuario FROM usuario WHERE correo = $1 AND estado = 'PENDIENTE'", [correo]);
  if (usuario.rows.length === 0) return false;

  await enviarCodigo('REGISTRO', correo, usuario.rows[0].id_usuario, 'Usa este código para confirmar tu correo y activar tu cuenta.');
  return true;
}

// Paso 2 del registro: si el código es correcto, la cuenta pasa a ACTIVO y se inicia la sesión.
export async function confirmarCorreo(correo: string, codigo: string, ip: string | null): Promise<Sesion | null> {
  const codigoCorrecto = await validarCodigo('REGISTRO', correo, codigo);
  if (!codigoCorrecto) return null;

  const resultado = await pool.query(
    `UPDATE usuario SET estado = 'ACTIVO' WHERE correo = $1 AND estado = 'PENDIENTE'
     RETURNING id_usuario, nombres, apellidos, correo`,
    [correo]
  );
  if (resultado.rows.length === 0) return null;
  const idUsuario = resultado.rows[0].id_usuario;

  await pool.query(
    `INSERT INTO actividad_usuario (id_usuario, tipo_evento, ip_origen) VALUES ($1, 'REGISTRO', $2)`,
    [idUsuario, ip]
  );
  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
     VALUES ($1, 'REGISTRAR_USUARIO', 'usuario', $1, 'Cuenta creada y correo confirmado con código', $2)`,
    [idUsuario, ip]
  );

  return crearSesion({ ...resultado.rows[0], rol: 'PROPIETARIO' });
}
