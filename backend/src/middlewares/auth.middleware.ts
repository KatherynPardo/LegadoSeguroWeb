// Middleware: exige una sesión válida (token JWT) para entrar a las rutas protegidas.
// Si el token es correcto, deja el id del usuario en res.locals.usuarioId.

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization;

  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'No has iniciado sesión' });
    return;
  }

  try {
    const datos = jwt.verify(cabecera.slice(7), JWT_SECRET) as { id: number };
    res.locals.usuarioId = datos.id;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Tu sesión expiró, inicia sesión de nuevo' });
  }
}
