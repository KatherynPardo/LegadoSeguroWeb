// Proceso de liberación: la entrega del legado a los beneficiarios cuando el dueño deja de dar señales.
//
// Estados (columna proceso_liberacion.estado):
//   DETECTADO       el sistema detectó la inactividad
//   EN_CONFIRMACION se pide a los beneficiarios que confirmen
//   EN_ESPERA       se cumplieron las confirmaciones y corre el período de espera
//   LIBERADO        se entregaron los activos
//   CANCELADO       el dueño reapareció y canceló el proceso
export const ESTADOS_PROCESO = ['DETECTADO', 'EN_CONFIRMACION', 'EN_ESPERA', 'LIBERADO', 'CANCELADO'];

// Fila del listado de procesos.
export type ProcesoResumen = {
  id: number;
  estado: string;
  motivo: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  minConfirmaciones: number;
  diasPeriodoEspera: number;
  activos: number;
  confirmaciones: number; // beneficiarios distintos que ya confirmaron
  objeciones: number;     // objeciones abiertas
};

export type ActivoProceso = { nombre: string; tipo: string; sensibilidad: string; estado: string };
export type ConfirmacionProceso = { beneficiario: string; activo: string; resultado: string; fecha: string | null };
export type ObjecionProceso = { autor: string; motivo: string; estado: string; fecha: string };
export type EntregaProceso = { activo: string; beneficiario: string; estado: string; fechaAcceso: string | null };

// Detalle completo de un proceso.
export type ProcesoDetalle = ProcesoResumen & {
  activosIncluidos: ActivoProceso[];
  confirmacionesDetalle: ConfirmacionProceso[];
  objeccionesDetalle: ObjecionProceso[];
  entregas: EntregaProceso[];
};
