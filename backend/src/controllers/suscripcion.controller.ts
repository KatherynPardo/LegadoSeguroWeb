// Controlador de planes y suscripción.

import { Request, Response } from 'express';
import {
  cambiarPlan, confirmarPago, iniciarPago, listarPlanes, obtenerSuscripcion, ReglaPago, validarComprobante, verPago
} from '../services/suscripcion.service';
import { generarComprobante } from '../services/comprobante.service';
import { FRONTEND_URL } from '../config/env';
import { obtenerIp } from '../utils/ip';

// GET /api/planes (pública): los planes y sus precios, para la página de inicio
export async function verPlanes(_req: Request, res: Response) {
  try {
    res.json(await listarPlanes());
  } catch (error) {
    console.error('Error al listar los planes:', error);
    res.status(500).json({ mensaje: 'Error al obtener los planes' });
  }
}

export async function verSuscripcion(_req: Request, res: Response) {
  try {
    res.json(await obtenerSuscripcion(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al obtener la suscripción:', error);
    res.status(500).json({ mensaje: 'Error al obtener la suscripción' });
  }
}

export async function elegirPlan(req: Request, res: Response) {
  const idPlan = req.body.idPlan;
  if (!Number.isInteger(idPlan) || idPlan <= 0) {
    res.status(400).json({ mensaje: 'Elige un plan' });
    return;
  }

  try {
    const problema = await cambiarPlan(idPlan, res.locals.usuarioId, obtenerIp(req));
    if (problema) {
      res.status(409).json({ mensaje: problema });
      return;
    }
    res.json({ mensaje: 'Plan actualizado' });
  } catch (error) {
    console.error('Error al cambiar el plan:', error);
    res.status(500).json({ mensaje: 'Error al cambiar el plan' });
  }
}

// POST /api/suscripcion/pago/iniciar (con sesión): prepara el formulario de pago de Niubiz
export async function iniciarPagoPlan(req: Request, res: Response) {
  const idPlan = req.body.idPlan;
  if (!Number.isInteger(idPlan) || idPlan <= 0) {
    res.status(400).json({ mensaje: 'Elige un plan' });
    return;
  }

  // Los términos y condiciones se aceptan antes de pagar, dentro del proceso de compra
  if (req.body.aceptoTerminos !== true) {
    res.status(400).json({ mensaje: 'Acepta los términos y condiciones para continuar' });
    return;
  }

  try {
    // Boleta (por defecto) o factura con RUC y razón social
    const comprobante = validarComprobante(req.body.comprobante);
    res.json(await iniciarPago(idPlan, res.locals.usuarioId, obtenerIp(req), comprobante));
  } catch (error) {
    if (error instanceof ReglaPago) {
      res.status(error.estado).json({ mensaje: error.message });
      return;
    }
    console.error('Error al iniciar el pago:', error);
    res.status(500).json({ mensaje: 'Error al iniciar el pago' });
  }
}

// GET /api/suscripcion/pago/:numeroPedido (con sesión): resultado de un pago del propio usuario
export async function verResultadoPago(req: Request, res: Response) {
  const numeroPedido = Number(req.params.numeroPedido);
  if (!Number.isInteger(numeroPedido) || numeroPedido <= 0) {
    res.status(400).json({ mensaje: 'Pedido no válido' });
    return;
  }

  try {
    res.json(await verPago(numeroPedido, res.locals.usuarioId));
  } catch (error) {
    if (error instanceof ReglaPago) {
      res.status(error.estado).json({ mensaje: error.message });
      return;
    }
    console.error('Error al consultar el pago:', error);
    res.status(500).json({ mensaje: 'Error al consultar el pago' });
  }
}

// GET /api/suscripcion/pago/:numeroPedido/comprobante (con sesión): boleta o factura en PDF de un pago aprobado
export async function descargarComprobante(req: Request, res: Response) {
  const numeroPedido = Number(req.params.numeroPedido);
  if (!Number.isInteger(numeroPedido) || numeroPedido <= 0) {
    res.status(400).json({ mensaje: 'Pedido no válido' });
    return;
  }

  try {
    const { pdf, nombre } = await generarComprobante(numeroPedido, res.locals.usuarioId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(pdf);
  } catch (error) {
    if (error instanceof ReglaPago) {
      res.status(error.estado).json({ mensaje: error.message });
      return;
    }
    console.error('Error al generar el comprobante:', error);
    res.status(500).json({ mensaje: 'Error al generar el comprobante' });
  }
}

// POST /api/pago/respuesta (pública): aquí llega el navegador desde el formulario de Niubiz, sin sesión.
// Se identifica el pago por su número de pedido; al terminar se devuelve al usuario a la pantalla de Suscripción.
export async function respuestaPago(req: Request, res: Response) {
  const numeroPedido = Number(req.query.pedido);
  const token = String(req.body?.transactionToken ?? '');
  const volver = `${FRONTEND_URL}/suscripcion`;

  if (!Number.isInteger(numeroPedido) || numeroPedido <= 0 || !token || req.body?.channel === 'pagoefectivo') {
    res.redirect(303, volver);
    return;
  }

  try {
    await confirmarPago(numeroPedido, token, obtenerIp(req));
  } catch (error) {
    console.error('Error al registrar la respuesta del pago:', error);
  }
  res.redirect(303, `${volver}?pedido=${numeroPedido}`);
}
