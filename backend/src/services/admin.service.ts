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

// Alertas de inactividad enviadas, de la más reciente a la más antigua
export async function listarAlertas() {
  const r = await pool.query(
    `SELECT al.id_alerta AS id, u.nombres || ' ' || u.apellidos AS usuario, u.correo,
            rl.dias_inactividad AS "diasInactividad", al.fecha_alerta AS "fechaAlerta",
            al.fecha_limite AS "fechaLimite", al.estado
     FROM alerta_inactividad al
     JOIN usuario u ON u.id_usuario = al.id_usuario
     JOIN regla_liberacion rl ON rl.id_regla = al.id_regla
     ORDER BY al.id_alerta DESC LIMIT 50`
  );
  return r.rows;
}

// Solo para pruebas: hace que el plazo de una alerta venza ya, para ver el proceso sin esperar los días
export async function adelantarAlerta(idAlerta: number, idAdmin: number, ip: string | null): Promise<boolean> {
  const r = await pool.query(
    "UPDATE alerta_inactividad SET fecha_limite = NOW() WHERE id_alerta = $1 AND estado = 'ENVIADA' RETURNING id_alerta",
    [idAlerta]
  );
  if (r.rows.length === 0) return false;

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
     VALUES ($1, 'ADELANTAR_ALERTA', 'alerta_inactividad', $2, 'El administrador adelantó el vencimiento de una alerta (prueba)', $3)`,
    [idAdmin, idAlerta, ip]
  );
  return true;
}
