// Regla de liberación: cuándo y cómo se inicia la entrega del legado.
export type Regla = {
  id: number;
  diasInactividad: number;
  minConfirmaciones: number;
  diasPeriodoEspera: number;
  requiereValidador: boolean;
};

// Lo que el usuario configura (sin el id).
export type DatosRegla = Omit<Regla, 'id'>;

// La regla activa (o null si todavía no tiene) y cuántos beneficiarios tiene,
// porque las confirmaciones mínimas no pueden superar esa cantidad.
export type ReglaConContexto = {
  regla: Regla | null;
  totalBeneficiarios: number;
};

// Los días de inactividad son libres, dentro de un rango razonable (de una semana a diez años).
export const DIAS_INACTIVIDAD_MIN = 7;
export const DIAS_INACTIVIDAD_MAX = 3650;

// Opciones permitidas para el período de espera final.
export const PERIODOS_ESPERA_VALIDOS = [7, 15, 30, 60];
