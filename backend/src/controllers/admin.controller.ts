// Controlador de administración (solo rol ADMINISTRADOR).

import { Request, Response } from 'express';
import { adelantarAlerta, cambiarEstado, listarAlertas, listarAuditoria, listarUsuarios } from '../services/admin.service';
import { ejecutarMonitoreo } from '../services/monitoreo.service';
import { pool } from '../config/database';
import { obtenerIp } from '../utils/ip';

export async function obtenerAuditoria(_req: Request, res: Response) {
  try {
    res.json(await listarAuditoria());
  } catch (error) {
    console.error('Error al listar la auditoría:', error);
    res.status(500).json({ mensaje: 'Error al listar la auditoría' });
  }
}

export async function obtenerUsuarios(_req: Request, res: Response) {
  try {
    res.json(await listarUsuarios());
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ mensaje: 'Error al listar usuarios' });
  }
}

export async function actualizarEstado(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { estado } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Usuario no válido' });
    return;
  }
  if (estado !== 'ACTIVO' && estado !== 'INACTIVO') {
    res.status(400).json({ mensaje: 'Estado no válido' });
    return;
  }
  if (id === res.locals.usuarioId) {
    res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
    return;
  }

  try {
    const existe = await cambiarEstado(id, estado, res.locals.usuarioId, obtenerIp(req));
    if (!existe) {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
      return;
    }
    res.json({ mensaje: estado === 'ACTIVO' ? 'Cuenta activada' : 'Cuenta desactivada' });
  } catch (error) {
    console.error('Error al cambiar el estado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
}

export async function obtenerAlertas(_req: Request, res: Response) {
  try {
    res.json(await listarAlertas());
  } catch (error) {
    console.error('Error al listar las alertas:', error);
    res.status(500).json({ mensaje: 'Error al listar las alertas' });
  }
}

// Ejecuta el monitoreo ahora mismo, sin esperar la revisión de cada hora
export async function ejecutarMonitoreoAhora(req: Request, res: Response) {
  try {
    const resumen = await ejecutarMonitoreo();
    await pool.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, descripcion, ip_origen)
       VALUES ($1, 'EJECUTAR_MONITOREO', 'proceso_liberacion', $2, $3)`,
      [res.locals.usuarioId, `Revisados ${resumen.revisados}: ${resumen.alertas} alerta(s), ${resumen.iniciados} proceso(s), ${resumen.liberados} liberado(s)`, obtenerIp(req)]
    );
    res.json(resumen);
  } catch (error) {
    console.error('Error al ejecutar el monitoreo:', error);
    res.status(500).json({ mensaje: 'Error al ejecutar el monitoreo' });
  }
}

export async function adelantarVencimiento(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Alerta no válida' });
    return;
  }

  try {
    const hecho = await adelantarAlerta(id, res.locals.usuarioId, obtenerIp(req));
    if (!hecho) {
      res.status(404).json({ mensaje: 'La alerta no existe o ya no está pendiente' });
      return;
    }
    res.json({ mensaje: 'Plazo adelantado: ejecuta el monitoreo para abrir el proceso' });
  } catch (error) {
    console.error('Error al adelantar la alerta:', error);
    res.status(500).json({ mensaje: 'Error al adelantar la alerta' });
  }
}
