// Servicio de administración: consulta de usuarios de la plataforma.

import { pool } from '../config/database';

export async function listarUsuarios() {
  const resultado = await pool.query(
    `SELECT u.id_usuario AS id, u.nombres, u.apellidos, u.correo, u.dni, r.nombre AS rol,
            u.estado, u.fecha_registro AS "fechaRegistro",
            (SELECT COUNT(*)::int FROM activo_digital a WHERE a.id_usuario = u.id_usuario) AS activos
     FROM usuario u
     JOIN rol r ON r.id_rol = u.id_rol
     ORDER BY u.fecha_registro DESC`
  );
  return resultado.rows;
}

// Activa o desactiva una cuenta. Un usuario inactivo ya no puede iniciar sesión.
export async function cambiarEstado(idUsuario: number, estado: 'ACTIVO' | 'INACTIVO') {
  const resultado = await pool.query(
    'UPDATE usuario SET estado = $1 WHERE id_usuario = $2 RETURNING id_usuario',
    [estado, idUsuario]
  );
  return resultado.rows.length > 0;
}
