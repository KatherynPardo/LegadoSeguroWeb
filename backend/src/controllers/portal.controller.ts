// Controlador del portal del heredero.

import { Request, Response } from 'express';
import { enviarCodigoPortal, entrarAlPortal } from '../services/portal.service';
import { checklistDelHeredero, marcarDocumento } from '../services/documento.service';
import {
  solicitudesDelHeredero, validarDni, guardarSelfie, confirmarParticipacion, presentarObjecion, ReglaLiberacion
} from '../services/liberacion.service';
import { texto } from '../utils/validar';
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
  const idBeneficiario = Number(req.params.idBeneficiario);
  const idRequisito = Number(req.params.idRequisito);
  if (!Number.isInteger(idBeneficiario) || idBeneficiario <= 0 || !Number.isInteger(idRequisito) || idRequisito <= 0 || typeof req.body.entregado !== 'boolean') {
    res.status(400).json({ mensaje: 'Datos no válidos' });
    return;
  }

  try {
    const hecho = await marcarDocumento(idBeneficiario, idRequisito, res.locals.correoHeredero, req.body.entregado);
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

// ---- Solicitudes de liberación (Figma 06) ----

function responderError(error: unknown, res: Response, accion: string) {
  if (error instanceof ReglaLiberacion) {
    res.status(error.estado).json({ mensaje: error.message });
    return;
  }
  console.error(`Error al ${accion}:`, error);
  res.status(500).json({ mensaje: `Error al ${accion}` });
}

// Lee los dos números de la ruta: el proceso y el heredero
function leerIds(req: Request, res: Response): { idProceso: number; idBeneficiario: number } | null {
  const idProceso = Number(req.params.idProceso);
  const idBeneficiario = Number(req.params.idBeneficiario);
  if (!Number.isInteger(idProceso) || idProceso <= 0 || !Number.isInteger(idBeneficiario) || idBeneficiario <= 0) {
    res.status(400).json({ mensaje: 'Solicitud no válida' });
    return null;
  }
  return { idProceso, idBeneficiario };
}

export async function verSolicitudes(_req: Request, res: Response) {
  try {
    res.json(await solicitudesDelHeredero(res.locals.correoHeredero));
  } catch (error) {
    responderError(error, res, 'obtener tus solicitudes');
  }
}

export async function paso2Dni(req: Request, res: Response) {
  const ids = leerIds(req, res);
  if (!ids) return;
  if (typeof req.body.dni !== 'string' || req.body.dni.length !== 8 || isNaN(Number(req.body.dni))) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }

  try {
    res.json(await validarDni(res.locals.correoHeredero, ids.idProceso, ids.idBeneficiario, req.body.dni));
  } catch (error) {
    responderError(error, res, 'validar el DNI');
  }
}

export async function paso3Selfie(req: Request, res: Response) {
  const ids = leerIds(req, res);
  if (!ids) return;
  if (typeof req.body.imagen !== 'string') {
    res.status(400).json({ mensaje: 'Falta la foto' });
    return;
  }

  try {
    await guardarSelfie(res.locals.correoHeredero, ids.idProceso, ids.idBeneficiario, req.body.imagen);
    res.json({ mensaje: 'Foto guardada' });
  } catch (error) {
    responderError(error, res, 'guardar la foto');
  }
}

export async function confirmar(req: Request, res: Response) {
  const ids = leerIds(req, res);
  if (!ids) return;

  try {
    res.json(await confirmarParticipacion(res.locals.correoHeredero, ids.idProceso, ids.idBeneficiario));
  } catch (error) {
    responderError(error, res, 'confirmar tu participación');
  }
}

export async function objetar(req: Request, res: Response) {
  const ids = leerIds(req, res);
  if (!ids) return;

  const motivo = texto(req.body.motivo, 300);
  if (!motivo || motivo.length < 10) {
    res.status(400).json({ mensaje: 'Explica el motivo de tu objeción (entre 10 y 300 caracteres)' });
    return;
  }

  try {
    await presentarObjecion(res.locals.correoHeredero, ids.idProceso, ids.idBeneficiario, motivo);
    res.status(201).json({ mensaje: 'Tu objeción fue registrada' });
  } catch (error) {
    responderError(error, res, 'presentar la objeción');
  }
}
