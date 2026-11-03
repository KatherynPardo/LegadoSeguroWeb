// Controlador: recibe el pedido HTTP, valida, llama al servicio y responde en JSON.

import { Request, Response } from 'express';
import {
  listarBeneficiarios, crearBeneficiario, actualizarBeneficiario, eliminarBeneficiario, ReglaHeredero
} from '../services/beneficiario.service';
import { esCorreo, esDni, esTelefono, texto } from '../utils/validar';

const PARENTESCOS = ['Hijo/a', 'Esposo/a', 'Padre', 'Madre', 'Hermano/a', 'Otro'];

function responderError(error: unknown, res: Response, accion: string) {
  if (error instanceof ReglaHeredero) {
    res.status(error.estado).json({ mensaje: error.message });
    return;
  }
  console.error(`Error al ${accion}:`, error);
  res.status(500).json({ mensaje: `Error al ${accion}` });
}

// Valida los campos comunes (todos obligatorios). Devuelve los datos limpios o el primer error.
function leerCampos(body: any) {
  const nombres = texto(body.nombres, 100);
  if (!nombres) return 'Los nombres son obligatorios';
  const apellidos = texto(body.apellidos, 100);
  if (!apellidos) return 'Los apellidos son obligatorios';
  const correo = texto(body.correo, 150);
  if (!correo || !esCorreo(correo)) return 'Ingresa un correo válido';
  if (!esTelefono(body.telefono)) return 'El teléfono debe tener 9 dígitos';
  if (!PARENTESCOS.includes(body.parentesco)) return 'Elige el parentesco';

  return { nombres, apellidos, correo: correo.toLowerCase(), telefono: body.telefono as string, parentesco: body.parentesco as string };
}

export async function obtenerBeneficiarios(req: Request, res: Response) {
  try {
    res.json(await listarBeneficiarios(res.locals.usuarioId));
  } catch (error) {
    responderError(error, res, 'obtener los beneficiarios');
  }
}

export async function registrarBeneficiario(req: Request, res: Response) {
  const campos = leerCampos(req.body);
  if (typeof campos === 'string') {
    res.status(400).json({ mensaje: campos });
    return;
  }
  if (!esDni(req.body.dni)) {
    res.status(400).json({ mensaje: 'El DNI debe tener 8 dígitos' });
    return;
  }
  if (typeof req.body.claveAcceso !== 'string' || req.body.claveAcceso.length < 6) {
    res.status(400).json({ mensaje: 'La clave de acceso debe tener al menos 6 caracteres' });
    return;
  }

  try {
    const id = await crearBeneficiario(
      { ...campos, dni: req.body.dni, claveAcceso: req.body.claveAcceso },
      res.locals.usuarioId
    );
    res.status(201).json({ id });
  } catch (error) {
    responderError(error, res, 'registrar el beneficiario');
  }
}

export async function editarBeneficiario(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Heredero no válido' });
    return;
  }

  const campos = leerCampos(req.body);
  if (typeof campos === 'string') {
    res.status(400).json({ mensaje: campos });
    return;
  }

  // La clave es opcional al editar: solo se cambia si escriben una nueva
  const clave = req.body.claveAcceso;
  if (clave !== undefined && clave !== '' && (typeof clave !== 'string' || clave.length < 6)) {
    res.status(400).json({ mensaje: 'La clave de acceso debe tener al menos 6 caracteres' });
    return;
  }

  try {
    await actualizarBeneficiario(id, { ...campos, claveAcceso: clave ? clave : null }, res.locals.usuarioId);
    res.json({ mensaje: 'Heredero actualizado' });
  } catch (error) {
    responderError(error, res, 'actualizar el heredero');
  }
}

export async function borrarBeneficiario(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Heredero no válido' });
    return;
  }

  try {
    await eliminarBeneficiario(id, res.locals.usuarioId);
    res.json({ mensaje: 'Heredero eliminado' });
  } catch (error) {
    responderError(error, res, 'eliminar el heredero');
  }
}
