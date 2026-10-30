// Regla de liberación: mismas claves que devuelve /api/reglas.
export interface Regla {
    id: number;
    diasInactividad: number;
    minConfirmaciones: number;
    diasPeriodoEspera: number;
    requiereValidador: boolean;
}

// Datos que se envían al guardar (sin el id)
export type DatosRegla = Omit<Regla, 'id'>;

export interface ReglaConContexto {
    regla: Regla | null;
    totalBeneficiarios: number;
}
