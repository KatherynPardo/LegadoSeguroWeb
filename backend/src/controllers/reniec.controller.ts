// Controlador de consulta de DNI. El token del proveedor nunca sale del backend.

import { Request, Response } from 'express';
import { consultarDni, ErrorConsultaDni } from '../services/reniec.service';

export async function buscarPorDni(req: Request, res: Response) {
  const dni = String(req.params.dni);

  if (!/^\d{8}$/.test(dni)) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }

  try {
    res.json(await consultarDni(dni));
  } catch (error) {
    if (error instanceof ErrorConsultaDni) {
      res.status(error.estado).json({ mensaje: error.message });
      return;
    }
    console.error('Error al consultar el DNI:', error);
    res.status(500).json({ mensaje: 'Error al consultar el DNI' });
  }
}
