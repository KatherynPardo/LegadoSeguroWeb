// Controlador de planes y suscripción.

import { Request, Response } from 'express';
import { cambiarPlan, obtenerSuscripcion } from '../services/suscripcion.service';
import { obtenerIp } from '../utils/ip';

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
