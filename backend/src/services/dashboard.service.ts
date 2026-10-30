// Servicio del dashboard: cuenta los registros del usuario y trae su actividad reciente.

import { pool } from '../config/database';
import { Dashboard } from '../models/dashboard.model';

export async function obtenerResumen(idUsuario: number): Promise<Dashboard> {
  const id = [idUsuario];

  // Las consultas se lanzan a la vez para que respondan más rápido
  const [activos, beneficiarios, reglas, procesos, recientes] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM activo_digital WHERE id_usuario = $1', id),
    pool.query('SELECT COUNT(*)::int AS n FROM beneficiario WHERE id_usuario_propietario = $1', id),
    pool.query("SELECT COUNT(*)::int AS n FROM regla_liberacion WHERE id_usuario = $1 AND estado = 'ACTIVA'", id),
    pool.query('SELECT COUNT(*)::int AS n FROM proceso_liberacion WHERE id_usuario_propietario = $1 AND fecha_fin IS NULL', id),
    pool.query('SELECT nombre, fecha_registro FROM activo_digital WHERE id_usuario = $1 ORDER BY fecha_registro DESC LIMIT 5', id)
  ]);

  return {
    activos: activos.rows[0].n,
    beneficiarios: beneficiarios.rows[0].n,
    reglasActivas: reglas.rows[0].n,
    procesosEnCurso: procesos.rows[0].n,
    actividadReciente: recientes.rows.map(r => ({
      texto: `Nuevo activo digital registrado: ${r.nombre}`,
      fecha: r.fecha_registro
    }))
  };
}
