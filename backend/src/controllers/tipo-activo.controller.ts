// Controlador de tipos de activo.

import { Request, Response } from 'express';
import { listarTipos } from '../services/tipo-activo.service';

export async function obtenerTipos(req: Request, res: Response) {
  try {
    res.json(await listarTipos());
  } catch (error) {
    console.error('Error al consultar tipos de activo:', error);
    res.status(500).json({ mensaje: 'Error al obtener los tipos de activo' });
  }
}
