// Sugerencia de días de inactividad a partir de los ingresos del propietario.
// Es estadística descriptiva (no aprendizaje automático): con pocos datos se puede explicar en una línea.
//   1. Se cuenta un solo ingreso por día y se miden los días entre un ingreso y el siguiente.
//   2. Se toma el percentil 90 de esos intervalos: lo que normalmente no supera entre un ingreso y otro.
//   3. Se multiplica por un margen de seguridad y se sube al siguiente plazo habitual (15, 30, 90, 180 o 365 días).
//   4. Con menos de MIN_INTERVALOS intervalos no hay historial suficiente y se sugiere el valor por defecto.

import { DIAS_INACTIVIDAD_MAX, DIAS_INACTIVIDAD_MIN } from '../models/regla.model';

export const MARGEN_SEGURIDAD = 3;
export const MIN_INTERVALOS = 5;
export const DIAS_POR_DEFECTO = 90;
const PLAZOS_HABITUALES = [15, 30, 90, 180, 365];
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type Sugerencia = {
  dias: number;                    // plazo que se sugiere
  intervaloTipico: number | null;  // percentil 90 de los días entre ingresos (null si falta historial)
  intervalos: number;              // cuántos intervalos se pudieron medir
  minimoIntervalos: number;        // cuántos hacen falta para confiar en el cálculo
  suficiente: boolean;
};

// Percentil por el método del rango más cercano: sobre [1, 2, ..., 10] el percentil 90 es 9
function percentil(ordenados: number[], p: number): number {
  return ordenados[Math.ceil(p * ordenados.length) - 1];
}

export function calcularSugerencia(ingresos: Date[]): Sugerencia {
  // Un solo ingreso por día (en UTC), de menor a mayor
  const dias = [...new Set(ingresos.map(f => Math.floor(f.getTime() / MS_POR_DIA)))].sort((a, b) => a - b);
  const intervalos = dias.slice(1).map((d, i) => d - dias[i]);

  if (intervalos.length < MIN_INTERVALOS) {
    return { dias: DIAS_POR_DEFECTO, intervaloTipico: null, intervalos: intervalos.length, minimoIntervalos: MIN_INTERVALOS, suficiente: false };
  }

  const tipico = percentil([...intervalos].sort((a, b) => a - b), 0.9);
  const conMargen = tipico * MARGEN_SEGURIDAD;
  const habitual = PLAZOS_HABITUALES.find(p => p >= conMargen);
  const sugerido = habitual ?? Math.ceil(conMargen);

  return {
    dias: Math.min(Math.max(sugerido, DIAS_INACTIVIDAD_MIN), DIAS_INACTIVIDAD_MAX),
    intervaloTipico: tipico,
    intervalos: intervalos.length,
    minimoIntervalos: MIN_INTERVALOS,
    suficiente: true
  };
}
