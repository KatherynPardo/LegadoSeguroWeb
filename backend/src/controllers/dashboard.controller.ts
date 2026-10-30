// Controlador del dashboard.

import { Request, Response } from 'express';
import { obtenerResumen } from '../services/dashboard.service';

export async function obtenerDashboard(req: Request, res: Response) {
  try {
    res.json(await obtenerResumen());
  } catch (error) {
    console.error('Error al obtener el dashboard:', error);
    res.status(500).json({ mensaje: 'Error al obtener el resumen' });
  }
}
