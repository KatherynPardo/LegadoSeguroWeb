// Controlador de reglas de liberación.

import { Request, Response } from 'express';
import { DIAS_INACTIVIDAD_MAX, DIAS_INACTIVIDAD_MIN, PERIODOS_ESPERA_VALIDOS } from '../models/regla.model';
import { contarBeneficiarios, guardarRegla, obtenerRegla } from '../services/regla.service';
import { limiteDeHerederos } from '../services/suscripcion.service';

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
  const diasGracia = req.body.diasGracia === undefined ? 7 : req.body.diasGracia;

  if (!Number.isInteger(diasGracia) || diasGracia < 1 || diasGracia > 60) {
    res.status(400).json({ mensaje: 'Los días de gracia deben ser un número entre 1 y 60' });
    return;
  }

  if (!Number.isInteger(diasInactividad) || diasInactividad < DIAS_INACTIVIDAD_MIN || diasInactividad > DIAS_INACTIVIDAD_MAX) {
    res.status(400).json({ mensaje: `Los días de inactividad deben ser un número entre ${DIAS_INACTIVIDAD_MIN} y ${DIAS_INACTIVIDAD_MAX}` });
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

    // El plan también marca el máximo: con el plan Básico no se pueden pedir más confirmaciones que sus herederos permitidos
    const limite = await limiteDeHerederos(res.locals.usuarioId);
    if (limite !== null && minConfirmaciones > limite) {
      res.status(400).json({ mensaje: `Tu plan permite hasta ${limite} herederos: no puedes pedir más confirmaciones` });
      return;
    }

    const regla = await guardarRegla(
      { diasInactividad, minConfirmaciones, diasPeriodoEspera, requiereValidador, diasGracia },
      res.locals.usuarioId
    );
    res.json(regla);
  } catch (error) {
    console.error('Error al guardar la regla:', error);
    res.status(500).json({ mensaje: 'Error al guardar la regla de liberación' });
  }
}
