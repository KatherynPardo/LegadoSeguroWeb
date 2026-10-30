// Controlador del perfil: el usuario solo puede ver y editar SU propio perfil (viene del token).

import { Request, Response } from 'express';
import { actualizarPerfil, cambiarPassword, obtenerPerfil } from '../services/perfil.service';

export async function verPerfil(req: Request, res: Response) {
  try {
    const perfil = await obtenerPerfil(res.locals.usuarioId);
    if (!perfil) {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
      return;
    }
    res.json(perfil);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ mensaje: 'Error al obtener el perfil' });
  }
}

export async function editarPerfil(req: Request, res: Response) {
  const { nombres, apellidos, correo, telefono } = req.body;

  if (!nombres || !apellidos || !correo) {
    res.status(400).json({ mensaje: 'Nombres, apellidos y correo son obligatorios' });
    return;
  }
  if (!String(correo).includes('@')) {
    res.status(400).json({ mensaje: 'El correo no es válido' });
    return;
  }

  try {
    const perfil = await actualizarPerfil({ nombres, apellidos, correo, telefono }, res.locals.usuarioId);
    res.json(perfil);
  } catch (error: any) {
    // 23505 = violación de clave única: ese correo ya lo usa otra persona
    if (error.code === '23505') {
      res.status(409).json({ mensaje: 'Ese correo ya está en uso' });
      return;
    }
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
}

export async function editarPassword(req: Request, res: Response) {
  const { actual, nueva } = req.body;

  if (!actual || !nueva) {
    res.status(400).json({ mensaje: 'Ingresa tu contraseña actual y la nueva' });
    return;
  }
  if (String(nueva).length < 6) {
    res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
    return;
  }

  try {
    const cambiada = await cambiarPassword(actual, nueva, res.locals.usuarioId);
    if (!cambiada) {
      res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
      return;
    }
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
}
