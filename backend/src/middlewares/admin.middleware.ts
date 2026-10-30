// Middleware: solo deja pasar a usuarios con rol ADMINISTRADOR.
// Se usa después de verificarToken. El rol se consulta en la base, no se confía en el cliente.

import { NextFunction, Request, Response } from 'express';
import { pool } from '../config/database';

export async function soloAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    const resultado = await pool.query(
      `SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1 AND r.nombre = 'ADMINISTRADOR' AND u.estado = 'ACTIVO'`,
      [res.locals.usuarioId]
    );

    if (resultado.rows.length === 0) {
      res.status(403).json({ mensaje: 'No tienes permiso para esta sección' });
      return;
    }
    next();
  } catch (error) {
    console.error('Error al validar el rol:', error);
    res.status(500).json({ mensaje: 'Error al validar permisos' });
  }
}
