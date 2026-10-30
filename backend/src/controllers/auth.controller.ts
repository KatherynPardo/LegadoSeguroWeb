// Controlador de autenticación.

import { Request, Response } from 'express';
import { iniciarSesion } from '../services/auth.service';

export async function login(req: Request, res: Response) {
  const { correo, password } = req.body;

  if (!correo || !password) {
    res.status(400).json({ mensaje: 'Ingresa tu correo y tu contraseña' });
    return;
  }

  try {
    const sesion = await iniciarSesion(correo, password);

    if (!sesion) {
      // Mismo mensaje para correo o contraseña incorrectos: no se revela cuál falló
      res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
      return;
    }

    res.json(sesion);
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
}
