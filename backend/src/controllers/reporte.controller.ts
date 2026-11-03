// Controlador de reportes del usuario con sesión.

import { Request, Response } from 'express';
import { obtenerReporte } from '../services/reporte.service';

export async function verReporte(_req: Request, res: Response) {
  try {
    res.json(await obtenerReporte(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al generar el reporte:', error);
    res.status(500).json({ mensaje: 'Error al generar el reporte' });
  }
}
