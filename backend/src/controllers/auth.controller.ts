// Controlador de autenticación.

import { Request, Response } from 'express';
import { iniciarSesion, registrarUsuario } from '../services/auth.service';

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

export async function registro(req: Request, res: Response) {
  const { nombres, apellidos, dni, correo, telefono, password } = req.body;

  if (!nombres?.trim() || !apellidos?.trim()) {
    res.status(400).json({ mensaje: 'Ingresa tus nombres y apellidos' });
    return;
  }
  if (!/^\d{8}$/.test(dni ?? '')) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }
  if (!correo || !correo.includes('@')) {
    res.status(400).json({ mensaje: 'Ingresa un correo válido' });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  try {
    const sesion = await registrarUsuario({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      dni,
      correo: correo.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      password
    });

    if (!sesion) {
      res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo o DNI' });
      return;
    }

    res.status(201).json(sesion);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear la cuenta' });
  }
}
