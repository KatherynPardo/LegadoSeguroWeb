// Servicio del dashboard: cuenta los registros del usuario y trae su actividad reciente.

import { pool } from '../config/database';
import { Dashboard } from '../models/dashboard.model';

// Frase que se muestra en el dashboard para cada tipo de acción
function textoActividad(accion: string, descripcion: string | null): string {
  switch (accion) {
    case 'INICIO_SESION': return 'Inicio de sesión exitoso';
    case 'NUEVO_ACTIVO': return `Nuevo activo digital registrado: ${descripcion}`;
    case 'EDITAR_ACTIVO': return descripcion ?? 'Activo editado';
    case 'ELIMINAR_ACTIVO': return descripcion ?? 'Activo eliminado';
    case 'ASIGNAR_HEREDEROS': return 'Herederos asignados a un activo';
    case 'ELIMINAR_HEREDERO': return descripcion ?? 'Heredero eliminado';
    case 'INICIAR_PROCESO': return 'Se inició un proceso de liberación';
    case 'CANCELAR_PROCESO': return 'Proceso de liberación cancelado';
    case 'REGISTRAR_USUARIO': return 'Cuenta creada y correo confirmado';
    default: return descripcion ?? accion;
  }
}

export async function obtenerResumen(idUsuario: number): Promise<Dashboard> {
  const id = [idUsuario];

  // Las consultas se lanzan a la vez para que respondan más rápido
  const [activos, beneficiarios, reglas, procesos, recientes] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS n FROM activo_digital WHERE id_usuario = $1 AND estado = 'ACTIVO'", id),
    pool.query("SELECT COUNT(*)::int AS n FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'", id),
    pool.query("SELECT COUNT(*)::int AS n FROM regla_liberacion WHERE id_usuario = $1 AND estado = 'ACTIVA'", id),
    pool.query('SELECT COUNT(*)::int AS n FROM proceso_liberacion WHERE id_usuario_propietario = $1 AND fecha_fin IS NULL', id),
    // Actividad reciente: acciones guardadas, ingresos al sistema y activos creados
    pool.query(
      `SELECT fecha, accion, descripcion FROM (
         SELECT fecha, accion, descripcion FROM auditoria WHERE id_usuario = $1
         UNION ALL
         SELECT fecha_actividad, tipo_evento, NULL FROM actividad_usuario
           WHERE id_usuario = $1 AND tipo_evento = 'INICIO_SESION'
         UNION ALL
         SELECT fecha_registro, 'NUEVO_ACTIVO', nombre FROM activo_digital WHERE id_usuario = $1
       ) AS todo
       ORDER BY fecha DESC LIMIT 5`,
      id
    )
  ]);

  return {
    activos: activos.rows[0].n,
    beneficiarios: beneficiarios.rows[0].n,
    reglasActivas: reglas.rows[0].n,
    procesosEnCurso: procesos.rows[0].n,
    actividadReciente: recientes.rows.map(r => ({
      texto: textoActividad(r.accion, r.descripcion),
      fecha: r.fecha
    }))
  };
}
