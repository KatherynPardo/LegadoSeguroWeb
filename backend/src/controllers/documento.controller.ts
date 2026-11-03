// Controlador del checklist de documentos: catálogo (administrador) y herederos (propietario).

import { Request, Response } from 'express';
import {
  listarCatalogo, crearRequisito, editarRequisito, documentosDeHeredero, guardarDocumentosDeHeredero,
  ReglaDocumento, ItemDocumento
} from '../services/documento.service';
import { texto } from '../utils/validar';

function responderError(error: unknown, res: Response, accion: string) {
  if (error instanceof ReglaDocumento) {
    res.status(error.estado).json({ mensaje: error.message });
    return;
  }
  console.error(`Error al ${accion}:`, error);
  res.status(500).json({ mensaje: `Error al ${accion}` });
}

function leerId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Identificador no válido' });
    return null;
  }
  return id;
}

// ---- Administrador ----

export async function obtenerCatalogo(_req: Request, res: Response) {
  try {
    res.json(await listarCatalogo());
  } catch (error) {
    responderError(error, res, 'obtener los requisitos');
  }
}

// Valida los datos de un requisito. Devuelve los datos limpios o el mensaje de error.
function leerRequisito(body: any) {
  const nombre = texto(body.nombre, 150);
  if (!nombre) return 'El nombre es obligatorio (máximo 150 caracteres)';

  const descripcion = body.descripcion ? texto(body.descripcion, 300) : null;
  if (body.descripcion && !descripcion) return 'La descripción no es válida (máximo 300 caracteres)';

  if (typeof body.obligatorio !== 'boolean') return 'Indica si el requisito es obligatorio';
  return { nombre, descripcion, obligatorio: body.obligatorio as boolean };
}

export async function registrarRequisito(req: Request, res: Response) {
  const datos = leerRequisito(req.body);
  if (typeof datos === 'string') {
    res.status(400).json({ mensaje: datos });
    return;
  }

  try {
    const id = await crearRequisito(datos.nombre, datos.descripcion, datos.obligatorio);
    res.status(201).json({ id });
  } catch (error) {
    responderError(error, res, 'crear el requisito');
  }
}

export async function modificarRequisito(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  const datos = leerRequisito(req.body);
  if (typeof datos === 'string') {
    res.status(400).json({ mensaje: datos });
    return;
  }
  if (req.body.estado !== 'ACTIVO' && req.body.estado !== 'INACTIVO') {
    res.status(400).json({ mensaje: 'Estado no válido' });
    return;
  }

  try {
    await editarRequisito(id, datos.nombre, datos.descripcion, datos.obligatorio, req.body.estado);
    res.json({ mensaje: 'Requisito actualizado' });
  } catch (error) {
    responderError(error, res, 'actualizar el requisito');
  }
}

// ---- Propietario ----

export async function verDocumentos(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  try {
    res.json(await documentosDeHeredero(id, res.locals.usuarioId));
  } catch (error) {
    responderError(error, res, 'obtener los documentos');
  }
}

export async function guardarDocumentos(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  const lista = req.body.requisitos;
  if (!Array.isArray(lista)) {
    res.status(400).json({ mensaje: 'La lista de documentos no es válida' });
    return;
  }

  const items: ItemDocumento[] = [];
  for (const i of lista) {
    if (!Number.isInteger(i.idRequisito) || i.idRequisito <= 0) {
      res.status(400).json({ mensaje: 'La lista de documentos no es válida' });
      return;
    }
    const ubicacion = i.ubicacion ? texto(i.ubicacion, 200) : null;
    if (i.ubicacion && !ubicacion) {
      res.status(400).json({ mensaje: 'La nota de ubicación no es válida (máximo 200 caracteres)' });
      return;
    }
    items.push({ idRequisito: i.idRequisito, ubicacion });
  }

  try {
    await guardarDocumentosDeHeredero(id, res.locals.usuarioId, items);
    res.json({ mensaje: 'Documentos actualizados' });
  } catch (error) {
    responderError(error, res, 'guardar los documentos');
  }
}
