// Middleware: exige la sesión de un heredero (token con tipo HEREDERO).
// Deja su correo en res.locals.correoHeredero.

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export function verificarHeredero(req: Request, res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization;

  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'No has ingresado' });
    return;
  }

  try {
    const datos = jwt.verify(cabecera.slice(7), JWT_SECRET) as { tipo?: string; correo?: string };
    if (datos.tipo !== 'HEREDERO' || !datos.correo) {
      res.status(401).json({ mensaje: 'Esta sesión no es de un heredero' });
      return;
    }
    res.locals.correoHeredero = datos.correo;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Tu sesión expiró, ingresa de nuevo' });
  }
}
