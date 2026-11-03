// Servicio del dashboard: cifras, "salud" del legado, regla en acción y actividad reciente.

import { pool } from '../config/database';
import { Dashboard, PasoSalud } from '../models/dashboard.model';

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
    case 'CAMBIAR_PLAN': return descripcion ?? 'Plan cambiado';
    default: return descripcion ?? accion;
  }
}

export async function obtenerResumen(idUsuario: number): Promise<Dashboard> {
  const id = [idUsuario];

  // Las consultas se lanzan a la vez para que respondan más rápido
  const [activos, herederos, regla, procesos, ingresos, recientes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM activo_beneficiario ab
                JOIN beneficiario b ON b.id_beneficiario = ab.id_beneficiario
                WHERE ab.id_activo = a.id_activo AND b.estado = 'ACTIVO'
              ))::int AS "sinHeredero"
       FROM activo_digital a WHERE a.id_usuario = $1 AND a.estado = 'ACTIVO'`,
      id
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE correo_verificado)::int AS verificados
       FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'`,
      id
    ),
    pool.query("SELECT dias_inactividad FROM regla_liberacion WHERE id_usuario = $1 AND estado = 'ACTIVA' LIMIT 1", id),
    pool.query('SELECT COUNT(*)::int AS n FROM proceso_liberacion WHERE id_usuario_propietario = $1 AND fecha_fin IS NULL', id),
    // El ingreso de ahora es el más reciente; el anterior dice cuánto tiempo estuvo sin entrar
    pool.query(
      `SELECT fecha_actividad FROM actividad_usuario
       WHERE id_usuario = $1 AND tipo_evento = 'INICIO_SESION'
       ORDER BY fecha_actividad DESC LIMIT 2`,
      id
    ),
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
       ORDER BY fecha DESC LIMIT 6`,
      id
    )
  ]);

  const totalActivos: number = activos.rows[0].total;
  const sinHeredero: number = activos.rows[0].sinHeredero;
  const totalHerederos: number = herederos.rows[0].total;
  const verificados: number = herederos.rows[0].verificados;
  const reglaActiva = regla.rows.length > 0;

  // Salud del legado: 5 cosas que tiene que tener en orden, 20 puntos cada una
  const pasos: PasoSalud[] = [
    { texto: 'Registra tu primer activo digital', hecho: totalActivos > 0, ruta: '/activos' },
    { texto: sinHeredero > 0 ? `Asigna herederos a ${sinHeredero} ${sinHeredero === 1 ? 'activo' : 'activos'}` : 'Todos tus activos tienen heredero', hecho: totalActivos > 0 && sinHeredero === 0, ruta: '/activos' },
    { texto: 'Designa a tus herederos', hecho: totalHerederos > 0, ruta: '/beneficiarios' },
    { texto: verificados < totalHerederos ? `Verifica a ${totalHerederos - verificados} ${totalHerederos - verificados === 1 ? 'heredero' : 'herederos'}` : 'Tus herederos están verificados', hecho: totalHerederos > 0 && verificados === totalHerederos, ruta: '/beneficiarios' },
    { texto: 'Activa tu regla de liberación', hecho: reglaActiva, ruta: '/reglas' }
  ];
  const puntaje = pasos.filter(p => p.hecho).length * 20;

  // Días desde el ingreso anterior (si hubo uno)
  let diasDesdeIngresoAnterior: number | null = null;
  if (ingresos.rows.length > 1) {
    const anterior = new Date(ingresos.rows[1].fecha_actividad).getTime();
    diasDesdeIngresoAnterior = Math.floor((Date.now() - anterior) / 86400000);
  }

  return {
    activos: totalActivos,
    beneficiarios: totalHerederos,
    reglasActivas: reglaActiva ? 1 : 0,
    procesosEnCurso: procesos.rows[0].n,
    salud: { puntaje, pasos },
    inactividad: {
      limiteDias: reglaActiva ? regla.rows[0].dias_inactividad : null,
      diasDesdeIngresoAnterior
    },
    actividadReciente: recientes.rows.map(r => ({
      tipo: r.accion,
      texto: textoActividad(r.accion, r.descripcion),
      fecha: r.fecha
    }))
  };
}
