// Controlador de reglas de liberación.

import { Request, Response } from 'express';
import { DIAS_INACTIVIDAD_VALIDOS, PERIODOS_ESPERA_VALIDOS } from '../models/regla.model';
import { contarBeneficiarios, guardarRegla, obtenerRegla } from '../services/regla.service';

export async function verRegla(req: Request, res: Response) {
  try {
    res.json(await obtenerRegla(res.locals.usuarioId));
  } catch (error) {
    console.error('Error al obtener la regla:', error);
    res.status(500).json({ mensaje: 'Error al obtener la regla de liberación' });
  }
}

export async function configurarRegla(req: Request, res: Response) {
  const { diasInactividad, minConfirmaciones, diasPeriodoEspera, requiereValidador } = req.body;

  if (!DIAS_INACTIVIDAD_VALIDOS.includes(diasInactividad)) {
    res.status(400).json({ mensaje: 'Los días de inactividad no son válidos' });
    return;
  }
  if (!PERIODOS_ESPERA_VALIDOS.includes(diasPeriodoEspera)) {
    res.status(400).json({ mensaje: 'El período de espera no es válido' });
    return;
  }
  if (!Number.isInteger(minConfirmaciones) || minConfirmaciones < 1) {
    res.status(400).json({ mensaje: 'Las confirmaciones mínimas deben ser al menos 1' });
    return;
  }
  if (typeof requiereValidador !== 'boolean') {
    res.status(400).json({ mensaje: 'Indica si se requiere validador externo' });
    return;
  }

  try {
    // Las confirmaciones mínimas no pueden superar la cantidad de beneficiarios designados
    const total = await contarBeneficiarios(res.locals.usuarioId);
    if (total === 0) {
      res.status(400).json({ mensaje: 'Primero designa al menos un beneficiario' });
      return;
    }
    if (minConfirmaciones > total) {
      res.status(400).json({ mensaje: `Solo tienes ${total} beneficiario(s): no puedes pedir más confirmaciones` });
      return;
    }

    const regla = await guardarRegla(
      { diasInactividad, minConfirmaciones, diasPeriodoEspera, requiereValidador },
      res.locals.usuarioId
    );
    res.json(regla);
  } catch (error) {
    console.error('Error al guardar la regla:', error);
    res.status(500).json({ mensaje: 'Error al guardar la regla de liberación' });
  }
}
