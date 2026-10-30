// Controlador: recibe el pedido HTTP, llama al servicio y responde en JSON.

import { Request, Response } from 'express';
import { listarBeneficiarios, crearBeneficiario } from '../services/beneficiario.service';

export async function obtenerBeneficiarios(req: Request, res: Response) {
  try {
    res.json(await listarBeneficiarios(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al consultar beneficiarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los beneficiarios' });
  }
}

export async function registrarBeneficiario(req: Request, res: Response) {
  const { nombres, apellidos, dni, correo, parentesco, claveAcceso } = req.body;

  // Validaciones mínimas de los datos que llegan
  if (!nombres || !apellidos || !dni || !correo || !claveAcceso) {
    res.status(400).json({ mensaje: 'Completa todos los campos obligatorios' });
    return;
  }
  if (!/^\d{8}$/.test(dni)) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }
  if (!String(correo).includes('@')) {
    res.status(400).json({ mensaje: 'El correo no es válido' });
    return;
  }
  if (String(claveAcceso).length < 6) {
    res.status(400).json({ mensaje: 'La clave de acceso debe tener al menos 6 caracteres' });
    return;
  }

  try {
    const id = await crearBeneficiario(
      { nombres, apellidos, dni, correo, parentesco, claveAcceso },
      res.locals.usuarioId
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error al crear beneficiario:', error);
    res.status(500).json({ mensaje: 'Error al registrar el beneficiario' });
  }
}
