// Controlador de procesos de liberación.

import { Request, Response } from 'express';
import { cancelarProceso, listarProcesos, obtenerProceso } from '../services/proceso.service';

export async function obtenerProcesos(req: Request, res: Response) {
  try {
    res.json(await listarProcesos(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al consultar procesos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los procesos' });
  }
}

export async function verProceso(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ mensaje: 'Proceso no válido' });
    return;
  }

  try {
    const proceso = await obtenerProceso(id, res.locals.usuarioId);
    if (!proceso) {
      res.status(404).json({ mensaje: 'Proceso no encontrado' });
      return;
    }
    res.json(proceso);
  } catch (error) {
    console.error('Error al consultar el proceso:', error);
    res.status(500).json({ mensaje: 'Error al obtener el proceso' });
  }
}

export async function cancelar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ mensaje: 'Proceso no válido' });
    return;
  }

  try {
    const cancelado = await cancelarProceso(id, res.locals.usuarioId);
    if (!cancelado) {
      res.status(409).json({ mensaje: 'El proceso no existe, no es tuyo o ya terminó' });
      return;
    }
    res.json({ mensaje: 'Proceso cancelado' });
  } catch (error) {
    console.error('Error al cancelar el proceso:', error);
    res.status(500).json({ mensaje: 'Error al cancelar el proceso' });
  }
}
