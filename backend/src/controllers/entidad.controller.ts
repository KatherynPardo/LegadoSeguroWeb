// Controlador del catálogo de bancos.

import { Request, Response } from 'express';
import { crearEntidad, listarEntidades } from '../services/entidad.service';
import { texto } from '../utils/validar';

export async function obtenerEntidades(_req: Request, res: Response) {
  try {
    res.json(await listarEntidades(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al listar bancos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los bancos' });
  }
}

export async function registrarEntidad(req: Request, res: Response) {
  const nombre = texto(req.body.nombre, 100);
  if (!nombre || nombre.length < 2) {
    res.status(400).json({ mensaje: 'Escribe el nombre del banco (entre 2 y 100 caracteres)' });
    return;
  }

  try {
    const entidad = await crearEntidad(nombre, res.locals.usuarioId);
    if (!entidad) {
      res.status(409).json({ mensaje: 'Ese banco ya existe en la lista' });
      return;
    }
    res.status(201).json(entidad);
  } catch (error) {
    console.error('Error al crear banco:', error);
    res.status(500).json({ mensaje: 'Error al crear el banco' });
  }
}
