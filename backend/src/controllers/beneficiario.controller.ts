// Controlador: recibe el pedido HTTP, llama al servicio y responde en JSON.

import { Request, Response } from 'express';
import { listarBeneficiarios } from '../services/beneficiario.service';

export async function obtenerBeneficiarios(req: Request, res: Response) {
  try {
    res.json(await listarBeneficiarios());
  } catch (error) {
    console.error('Error al consultar beneficiarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los beneficiarios' });
  }
}
