// Middleware: limita cuántas consultas puede hacer una misma IP por minuto.
// Protege rutas públicas que gastan el token del proveedor de DNI.

import { NextFunction, Request, Response } from 'express';

export function limitarPorMinuto(maximo: number) {
  const intentos = new Map<string, { cantidad: number; reinicio: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ahora = Date.now();
    const clave = req.ip ?? 'desconocida';
    const registro = intentos.get(clave);

    if (!registro || registro.reinicio < ahora) {
      intentos.set(clave, { cantidad: 1, reinicio: ahora + 60000 });
      next();
      return;
    }

    registro.cantidad++;
    if (registro.cantidad > maximo) {
      res.status(429).json({ mensaje: 'Demasiadas consultas, espera un minuto' });
      return;
    }
    next();
  };
}
