// Controlador de activos digitales: valida lo que llega y deja las reglas de negocio al servicio.

import { Request, Response } from 'express';
import {
  listarActivos, crearActivo, actualizarActivo, eliminarActivo, asignarHerederos, historialDeMontos, ReglaActivo
} from '../services/activo.service';
import { Ahorro, DatosActivo, METODOS_AHORRO } from '../models/activo.model';
import { obtenerIp } from '../utils/ip';
import { texto } from '../utils/validar';

const MONTO_MAXIMO = 999999999999.99;

// Los herederos llegan como lista de ids; se descarta cualquier valor que no sea un entero positivo
function leerIds(valor: unknown): number[] | null {
  if (valor === undefined) return [];
  if (!Array.isArray(valor)) return null;
  return valor.every(v => Number.isInteger(v) && v > 0) ? (valor as number[]) : null;
}

// Valida los campos del activo. Devuelve los datos limpios o el mensaje del primer error.
function leerDatos(body: any): DatosActivo | string {
  const nombre = texto(body.nombre, 150);
  if (!nombre) return 'El nombre es obligatorio (máximo 150 caracteres)';

  const descripcion = texto(body.descripcion, 300);
  if (!descripcion) return 'La descripción es obligatoria (máximo 300 caracteres)';

  if (!Number.isInteger(body.id_tipo) || body.id_tipo <= 0) return 'Elige el tipo de activo';

  const idEntidad = body.id_entidad ?? null;
  if (idEntidad !== null && (!Number.isInteger(idEntidad) || idEntidad <= 0)) return 'El banco no es válido';

  const registrarMonto = body.registrar_monto === true;
  let moneda: 'PEN' | 'USD' | null = null;
  let monto: number | null = null;

  if (registrarMonto) {
    if (body.moneda !== 'PEN' && body.moneda !== 'USD') return 'Elige la moneda (soles o dólares)';
    if (typeof body.monto !== 'number' || !Number.isFinite(body.monto) || body.monto < 0 || body.monto > MONTO_MAXIMO) {
      return 'Ingresa un monto válido (0 o mayor)';
    }
    moneda = body.moneda;
    monto = Math.round(body.monto * 100) / 100;
  }

  // El método de ahorro y su rango son opcionales; si vienen, se revisan
  let ahorro: Ahorro | null = null;
  if (registrarMonto && body.ahorro) {
    const a = body.ahorro;
    if (!METODOS_AHORRO.includes(a.metodo)) return 'Elige un método de ahorro válido';
    const min = a.min ?? null;
    const max = a.max ?? null;
    for (const valor of [min, max]) {
      if (valor !== null && (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > MONTO_MAXIMO)) {
        return 'El rango de ahorro no es válido';
      }
    }
    if (min !== null && max !== null && min > max) return 'El mínimo del rango no puede ser mayor que el máximo';
    ahorro = { metodo: a.metodo, min, max };
  }

  return { nombre, descripcion, id_tipo: body.id_tipo, id_entidad: idEntidad, registrar_monto: registrarMonto, moneda, monto, ahorro };
}

function responderError(error: unknown, res: Response, accion: string) {
  if (error instanceof ReglaActivo) {
    res.status(error.estado).json({ mensaje: error.message });
    return;
  }
  console.error(`Error al ${accion}:`, error);
  res.status(500).json({ mensaje: `Error al ${accion}` });
}

function leerId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ mensaje: 'Activo no válido' });
    return null;
  }
  return id;
}

export async function obtenerActivos(req: Request, res: Response) {
  try {
    res.json(await listarActivos(res.locals.usuarioId));
  } catch (error) {
    responderError(error, res, 'obtener los activos');
  }
}

export async function registrarActivo(req: Request, res: Response) {
  const datos = leerDatos(req.body);
  if (typeof datos === 'string') {
    res.status(400).json({ mensaje: datos });
    return;
  }

  const beneficiarios = leerIds(req.body.beneficiarios);
  if (!beneficiarios) {
    res.status(400).json({ mensaje: 'La lista de herederos no es válida' });
    return;
  }

  try {
    const id = await crearActivo({ ...datos, beneficiarios }, res.locals.usuarioId, obtenerIp(req));
    res.status(201).json({ id });
  } catch (error) {
    responderError(error, res, 'crear el activo');
  }
}

export async function editarActivo(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  const datos = leerDatos(req.body);
  if (typeof datos === 'string') {
    res.status(400).json({ mensaje: datos });
    return;
  }

  try {
    await actualizarActivo(id, datos, res.locals.usuarioId, obtenerIp(req));
    res.json({ mensaje: 'Activo actualizado' });
  } catch (error) {
    responderError(error, res, 'actualizar el activo');
  }
}

export async function borrarActivo(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  try {
    await eliminarActivo(id, res.locals.usuarioId, obtenerIp(req));
    res.json({ mensaje: 'Activo eliminado' });
  } catch (error) {
    responderError(error, res, 'eliminar el activo');
  }
}

export async function asignarBeneficiarios(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  const beneficiarios = leerIds(req.body.beneficiarios);
  if (!beneficiarios || req.body.beneficiarios === undefined) {
    res.status(400).json({ mensaje: 'La lista de herederos no es válida' });
    return;
  }

  try {
    const existe = await asignarHerederos(id, beneficiarios, res.locals.usuarioId);
    if (!existe) {
      res.status(404).json({ mensaje: 'Activo no encontrado' });
      return;
    }
    res.json({ mensaje: 'Herederos actualizados' });
  } catch (error) {
    responderError(error, res, 'asignar los herederos');
  }
}

export async function obtenerHistorial(req: Request, res: Response) {
  const id = leerId(req, res);
  if (id === null) return;

  try {
    const historial = await historialDeMontos(id, res.locals.usuarioId);
    if (!historial) {
      res.status(404).json({ mensaje: 'Activo no encontrado' });
      return;
    }
    res.json(historial);
  } catch (error) {
    responderError(error, res, 'obtener el historial');
  }
}
