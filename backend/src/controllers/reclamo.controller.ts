// Controlador del libro de reclamaciones (ruta pública, con límite de pedidos por minuto).

import { Request, Response } from 'express';
import { DatosReclamo, registrarReclamo } from '../services/reclamo.service';
import { obtenerIp } from '../utils/ip';
import { esCorreo, esDni, esTelefono, texto } from '../utils/validar';

const TIPOS = ['RECLAMO', 'QUEJA'];
const DOCUMENTOS = ['DNI', 'CE', 'PASAPORTE'];

// POST /api/reclamos
export async function crearReclamo(req: Request, res: Response) {
  const b = req.body ?? {};

  const nombres = texto(b.nombres, 100);
  const apellidos = texto(b.apellidos, 100);
  const correo = texto(b.correo, 150);
  const direccion = texto(b.direccion, 200);
  const detalle = texto(b.detalle, 2000);
  const pedido = texto(b.pedido, 1000);
  const documento = texto(b.documento, 15);

  if (!TIPOS.includes(b.tipo) || !DOCUMENTOS.includes(b.tipoDocumento)) {
    res.status(400).json({ mensaje: 'Elige si es un reclamo o una queja y el tipo de documento' });
    return;
  }
  if (!nombres || !apellidos || !direccion || !detalle || !pedido || !documento || !correo) {
    res.status(400).json({ mensaje: 'Completa todos los campos obligatorios' });
    return;
  }
  if (b.tipoDocumento === 'DNI' ? !esDni(documento) : !/^[A-Za-z0-9]{6,15}$/.test(documento)) {
    res.status(400).json({ mensaje: 'El número de documento no es válido' });
    return;
  }
  if (!esCorreo(correo)) {
    res.status(400).json({ mensaje: 'El correo no es válido' });
    return;
  }
  const telefono = b.telefono ? String(b.telefono).trim() : null;
  if (telefono && !esTelefono(telefono)) {
    res.status(400).json({ mensaje: 'El teléfono debe tener 9 dígitos' });
    return;
  }
  const monto = b.monto === undefined || b.monto === null || b.monto === '' ? null : Number(b.monto);
  if (monto !== null && (!Number.isFinite(monto) || monto < 0 || monto > 1000000)) {
    res.status(400).json({ mensaje: 'El monto reclamado no es válido' });
    return;
  }
  if (b.autorizaDatos !== true) {
    res.status(400).json({ mensaje: 'Debes autorizar el uso de tus datos para atender tu reclamo' });
    return;
  }

  try {
    const datos: DatosReclamo = {
      tipo: b.tipo, nombres, apellidos, tipoDocumento: b.tipoDocumento, documento, correo, telefono, direccion, monto, detalle, pedido
    };
    res.status(201).json(await registrarReclamo(datos, obtenerIp(req)));
  } catch (error) {
    console.error('Error al registrar el reclamo:', error);
    res.status(500).json({ mensaje: 'No se pudo registrar tu hoja de reclamación. Inténtalo más tarde' });
  }
}
