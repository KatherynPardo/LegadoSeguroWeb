// Controlador de activos digitales.

import { Request, Response } from 'express';
import { listarActivos } from '../services/activo.service';

export async function obtenerActivos(req: Request, res: Response) {
  try {
    res.json(await listarActivos());
  } catch (error) {
    console.error('Error al consultar activos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los activos' });
  }
}
