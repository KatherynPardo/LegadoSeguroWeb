// Controlador del historial del usuario con sesión.

import { Request, Response } from 'express';
import { listarHistorial } from '../services/historial.service';

export async function obtenerHistorial(_req: Request, res: Response) {
  try {
    res.json(await listarHistorial(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ mensaje: 'Error al obtener el historial' });
  }
}
