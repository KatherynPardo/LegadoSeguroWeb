// Controlador de salud: confirma que el servidor y la base de datos responden.

import { Request, Response } from 'express';
import { horaDeLaBaseDeDatos } from '../services/salud.service';

export async function comprobarSalud(req: Request, res: Response) {
  try {
    res.json({ estado: 'ok', horaBaseDeDatos: await horaDeLaBaseDeDatos() });
  } catch (error) {
    console.error('Error al conectar con la BD:', error);
    res.status(500).json({ estado: 'error', mensaje: 'No se pudo conectar a la base de datos' });
  }
}
