// Obtiene la IP desde la que llega la petición, sin el prefijo IPv6 "::ffff:" de las IPv4.
// Si el backend se despliega detrás de un proxy, hay que activar "trust proxy" en app.ts.

import { Request } from 'express';

export function obtenerIp(req: Request): string | null {
  const ip = req.ip;
  if (!ip) return null;
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}
