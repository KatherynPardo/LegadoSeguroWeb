// Proceso de liberación: mismas claves que devuelve /api/procesos.
export interface ProcesoResumen {
    id: number;
    estado: string;
    motivo: string | null;
    fechaInicio: string;
    fechaFin: string | null;
    minConfirmaciones: number;
    diasPeriodoEspera: number;
    activos: number;
    confirmaciones: number;
    objeciones: number;
}

export interface ActivoProceso { nombre: string; tipo: string; sensibilidad: string; estado: string; }
export interface ConfirmacionProceso { beneficiario: string; activo: string; resultado: string; fecha: string | null; }
export interface ObjecionProceso { autor: string; motivo: string; estado: string; fecha: string; }
export interface EntregaProceso { activo: string; beneficiario: string; estado: string; fechaAcceso: string | null; }

export interface ProcesoDetalle extends ProcesoResumen {
    activosIncluidos: ActivoProceso[];
    confirmacionesDetalle: ConfirmacionProceso[];
    objeccionesDetalle: ObjecionProceso[];
    entregas: EntregaProceso[];
}
