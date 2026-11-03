// Monitoreo de inactividad: el "paso 1" de la regla de liberación, en dos etapas.
//   1. ALERTA: cuando pasan los días de inactividad de la regla, se avisa al propietario por correo
//      y se le da un plazo de gracia para entrar.
//   2. PROCESO: si el plazo termina y no entró, recién ahí se abre el proceso y se avisa a los herederos.
// Si el propietario inicia sesión durante el plazo, la alerta queda resuelta y no pasa nada más.

import { pool } from '../config/database';
import { avisarInicioProceso, liberarProcesosListos } from './liberacion.service';
import { notificar } from './notificacion.service';

type Inactivo = {
  id_regla: number; id_usuario: number; dias_inactividad: number; dias_gracia: number;
  nombres: string; correo: string; ultima_actividad: string;
};

export type ResumenMonitoreo = { revisados: number; alertas: number; iniciados: number; liberados: number };

export async function ejecutarMonitoreo(): Promise<ResumenMonitoreo> {
  // Quien volvió a entrar después de la alerta ya no está en riesgo
  await pool.query(
    `UPDATE alerta_inactividad al SET estado = 'RESUELTA'
     WHERE al.estado = 'ENVIADA'
       AND EXISTS (SELECT 1 FROM actividad_usuario a WHERE a.id_usuario = al.id_usuario AND a.fecha_actividad > al.fecha_alerta)`
  );

  const revisados = await pool.query(
    "SELECT COUNT(*)::int AS n FROM regla_liberacion r JOIN usuario u ON u.id_usuario = r.id_usuario WHERE r.estado = 'ACTIVA' AND u.estado = 'ACTIVO'"
  );

  const inactivos = await buscarInactivosReal();
  let alertas = 0;
  let iniciados = 0;

  for (const c of inactivos) {
    const pendiente = await pool.query(
      "SELECT id_alerta, fecha_limite <= NOW() AS vencida FROM alerta_inactividad WHERE id_usuario = $1 AND estado = 'ENVIADA' ORDER BY id_alerta DESC LIMIT 1",
      [c.id_usuario]
    );

    if (pendiente.rows.length === 0) {
      await enviarAlerta(c);
      alertas++;
    } else if (pendiente.rows[0].vencida) {
      await iniciarProceso(c);
      await pool.query("UPDATE alerta_inactividad SET estado = 'VENCIDA' WHERE id_alerta = $1", [pendiente.rows[0].id_alerta]);
      iniciados++;
    }
  }

  const liberados = await liberarProcesosListos();
  return { revisados: revisados.rows[0].n, alertas, iniciados, liberados };
}

async function buscarInactivosReal(): Promise<Inactivo[]> {
  const r = await pool.query<Inactivo>(
    `SELECT r.id_regla, r.id_usuario, r.dias_inactividad, r.dias_gracia, u.nombres, u.correo,
            COALESCE((SELECT MAX(a.fecha_actividad) FROM actividad_usuario a WHERE a.id_usuario = r.id_usuario), u.fecha_registro) AS ultima_actividad
     FROM regla_liberacion r
     JOIN usuario u ON u.id_usuario = r.id_usuario
     WHERE r.estado = 'ACTIVA'
       AND u.estado = 'ACTIVO'
       AND NOT EXISTS (
         SELECT 1 FROM proceso_liberacion p
         WHERE p.id_usuario_propietario = r.id_usuario AND p.fecha_fin IS NULL
       )
       AND COALESCE(
             (SELECT MAX(a.fecha_actividad) FROM actividad_usuario a WHERE a.id_usuario = r.id_usuario),
             u.fecha_registro
           ) < NOW() - make_interval(days => r.dias_inactividad)`
  );
  return r.rows;
}

// Guarda la alerta y le avisa al propietario cuánto plazo tiene
async function enviarAlerta(c: Inactivo): Promise<void> {
  const alerta = await pool.query(
    `INSERT INTO alerta_inactividad (id_usuario, id_regla, fecha_limite)
     VALUES ($1, $2, NOW() + make_interval(days => $3)) RETURNING fecha_limite`,
    [c.id_usuario, c.id_regla, c.dias_gracia]
  );

  const dias = Math.floor((Date.now() - new Date(c.ultima_actividad).getTime()) / 86400000);
  const limite = new Date(alerta.rows[0].fecha_limite).toLocaleDateString('es-PE');

  await notificar(
    { idUsuario: c.id_usuario, correo: c.correo },
    null,
    'LegadoSeguro: ¿sigues ahí? Confirma que estás bien',
    `Hola ${c.nombres}, llevas ${dias} días sin entrar a LegadoSeguro y tu regla pide actuar a los ${c.dias_inactividad}. ` +
      `Tienes hasta el ${limite} (${c.dias_gracia} días) para iniciar sesión. Si no entras, avisaremos a tus herederos y comenzará el proceso de liberación.`
  );

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
     VALUES ($1, 'ALERTA_INACTIVIDAD', 'usuario', $1, $2)`,
    [c.id_usuario, `Alerta por ${dias} días sin actividad; plazo hasta el ${limite}`]
  );
}

async function iniciarProceso(c: Inactivo): Promise<void> {
  let idProcesoCreado = 0;
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const proceso = await cliente.query(
      `INSERT INTO proceso_liberacion (id_usuario_propietario, id_regla, estado, motivo)
       VALUES ($1, $2, 'DETECTADO', $3)
       RETURNING id_proceso`,
      [c.id_usuario, c.id_regla, `Inactividad superior a ${c.dias_inactividad} días`]
    );
    const idProceso = proceso.rows[0].id_proceso;
    idProcesoCreado = idProceso;

    // Entran al proceso todos los activos vigentes del usuario
    await cliente.query(
      `INSERT INTO proceso_activo (id_proceso, id_activo, estado)
       SELECT $1, id_activo, 'PENDIENTE' FROM activo_digital WHERE id_usuario = $2 AND estado = 'ACTIVO'`,
      [idProceso, c.id_usuario]
    );

    // Cada beneficiario asignado a un activo debe confirmar por ese activo
    await cliente.query(
      `INSERT INTO confirmacion_beneficiario (id_proceso, id_activo, id_beneficiario)
       SELECT $1, ab.id_activo, ab.id_beneficiario
       FROM activo_beneficiario ab
       JOIN activo_digital a ON a.id_activo = ab.id_activo
       WHERE a.id_usuario = $2 AND a.estado = 'ACTIVO' AND ab.estado = 'ACTIVO'`,
      [idProceso, c.id_usuario]
    );

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'INICIAR_PROCESO', 'proceso_liberacion', $2, $3)`,
      [c.id_usuario, idProceso, `El sistema detectó inactividad de más de ${c.dias_inactividad} días`]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  // Con el proceso ya guardado, se avisa al propietario y a los herederos
  await avisarInicioProceso(idProcesoCreado);
}
