// Controlador de activos digitales.

import { Request, Response } from 'express';
import { listarActivos, crearActivo } from '../services/activo.service';

export async function obtenerActivos(req: Request, res: Response) {
  try {
    res.json(await listarActivos());
  } catch (error) {
    console.error('Error al consultar activos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los activos' });
  }
}

export async function registrarActivo(req: Request, res: Response) {
  const { nombre, descripcion, id_tipo } = req.body;

  // Validación mínima: sin nombre o tipo no se puede crear
  if (!nombre || !id_tipo) {
    res.status(400).json({ mensaje: 'El nombre y el tipo son obligatorios' });
    return;
  }

  try {
    const id = await crearActivo({ nombre, descripcion, id_tipo });
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error al crear activo:', error);
    res.status(500).json({ mensaje: 'Error al crear el activo' });
  }
}
