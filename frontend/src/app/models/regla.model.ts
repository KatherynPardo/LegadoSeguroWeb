// Regla de liberación: mismas claves que devuelve /api/reglas.
export interface Regla {
    id: number;
    diasInactividad: number;
    minConfirmaciones: number;
    diasPeriodoEspera: number;
    requiereValidador: boolean;
    diasGracia: number; // días para entrar después de la alerta, antes de avisar a los herederos
}

// Datos que se envían al guardar (sin el id)
export type DatosRegla = Omit<Regla, 'id'>;

export interface ReglaConContexto {
    regla: Regla | null;
    totalBeneficiarios: number;
    limiteHerederos: number | null; // límite del plan (null = sin límite)
    maxConfirmaciones: number;      // lo máximo que se puede pedir
}
