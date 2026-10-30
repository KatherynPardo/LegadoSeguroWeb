// Controlador de administración (solo rol ADMINISTRADOR).

import { Request, Response } from 'express';
import { cambiarEstado, listarUsuarios } from '../services/admin.service';

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
    const existe = await cambiarEstado(id, estado);
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
