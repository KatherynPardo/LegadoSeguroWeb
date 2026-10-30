// Servicio de administración: consulta de usuarios y de la auditoría de la plataforma.

import { pool } from '../config/database';

export async function listarUsuarios() {
  const resultado = await pool.query(
    `SELECT u.id_usuario AS id, u.nombres, u.apellidos, u.correo, u.dni, r.nombre AS rol,
            u.estado, u.fecha_registro AS "fechaRegistro", u.ip_registro AS "ipRegistro",
            (SELECT COUNT(*)::int FROM activo_digital a WHERE a.id_usuario = u.id_usuario) AS activos,
            (SELECT MAX(fecha_actividad) FROM actividad_usuario x
              WHERE x.id_usuario = u.id_usuario AND x.tipo_evento = 'INICIO_SESION') AS "ultimoAcceso"
     FROM usuario u
     JOIN rol r ON r.id_rol = u.id_rol
     ORDER BY u.fecha_registro DESC`
  );
  return resultado.rows;
}

// Últimas acciones registradas, con quién las hizo y desde qué IP
export async function listarAuditoria() {
  const resultado = await pool.query(
    `SELECT a.id_auditoria AS id, a.fecha, a.accion, a.entidad, a.descripcion,
            a.ip_origen AS "ipOrigen",
            COALESCE(u.nombres || ' ' || u.apellidos, 'Sistema') AS usuario
     FROM auditoria a
     LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
     ORDER BY a.fecha DESC, a.id_auditoria DESC
     LIMIT 100`
  );
  return resultado.rows;
}

// Activa o desactiva una cuenta y deja el cambio en la auditoría. Un usuario inactivo ya no puede iniciar sesión.
export async function cambiarEstado(idUsuario: number, estado: 'ACTIVO' | 'INACTIVO', idAdmin: number, ip: string | null) {
  const resultado = await pool.query(
    'UPDATE usuario SET estado = $1 WHERE id_usuario = $2 RETURNING id_usuario',
    [estado, idUsuario]
  );
  if (resultado.rows.length === 0) return false;

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
     VALUES ($1, $2, 'usuario', $3, $4, $5)`,
    [
      idAdmin,
      estado === 'ACTIVO' ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
      idUsuario,
      `Cuenta ${estado === 'ACTIVO' ? 'activada' : 'desactivada'} por el administrador`,
      ip
    ]
  );
  return true;
}
