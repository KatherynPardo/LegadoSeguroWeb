// Controlador del portal del heredero.

import { Request, Response } from 'express';
import { enviarCodigoPortal, entrarAlPortal } from '../services/portal.service';
import { checklistDelHeredero, marcarDocumento } from '../services/documento.service';
import { esCorreo } from '../utils/validar';

export async function pedirCodigoPortal(req: Request, res: Response) {
  const correo = typeof req.body.correo === 'string' ? req.body.correo.trim().toLowerCase() : '';
  if (!esCorreo(correo)) {
    res.status(400).json({ mensaje: 'Ingresa un correo válido' });
    return;
  }

  try {
    await enviarCodigoPortal(correo);
    res.json({ mensaje: 'Si tu correo está registrado como heredero, te enviamos un código' });
  } catch (error) {
    console.error('Error al enviar el código del portal:', error);
    res.status(500).json({ mensaje: 'Error al enviar el código' });
  }
}

export async function entrarPortal(req: Request, res: Response) {
  const { correo, codigo } = req.body;
  if (typeof correo !== 'string' || typeof codigo !== 'string' || codigo.length !== 6 || isNaN(Number(codigo))) {
    res.status(400).json({ mensaje: 'Ingresa el código de 6 dígitos' });
    return;
  }

  try {
    const sesion = await entrarAlPortal(correo.trim().toLowerCase(), codigo);
    if (!sesion) {
      res.status(400).json({ mensaje: 'El código es incorrecto o ya venció' });
      return;
    }
    res.json(sesion);
  } catch (error) {
    console.error('Error al entrar al portal:', error);
    res.status(500).json({ mensaje: 'Error al ingresar' });
  }
}

export async function verChecklist(_req: Request, res: Response) {
  try {
    res.json(await checklistDelHeredero(res.locals.correoHeredero));
  } catch (error) {
    console.error('Error al obtener el checklist:', error);
    res.status(500).json({ mensaje: 'Error al obtener tu checklist' });
  }
}

export async function marcar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0 || typeof req.body.entregado !== 'boolean') {
    res.status(400).json({ mensaje: 'Datos no válidos' });
    return;
  }

  try {
    const hecho = await marcarDocumento(id, res.locals.correoHeredero, req.body.entregado);
    if (!hecho) {
      res.status(404).json({ mensaje: 'Documento no encontrado' });
      return;
    }
    res.json({ mensaje: 'Listo' });
  } catch (error) {
    console.error('Error al marcar el documento:', error);
    res.status(500).json({ mensaje: 'Error al guardar' });
  }
}
