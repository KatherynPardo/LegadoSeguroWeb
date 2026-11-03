// Un paso del plan para completar el legado
export interface PasoSalud {
    texto: string;
    hecho: boolean;
    ruta: string;
}

// Resumen del dashboard: mismas claves que devuelve /api/dashboard.
export interface Dashboard {
    activos: number;
    beneficiarios: number;
    reglasActivas: number;
    procesosEnCurso: number;
    salud: { puntaje: number; pasos: PasoSalud[] };
    inactividad: { limiteDias: number | null; diasDesdeIngresoAnterior: number | null };
    actividadReciente: { tipo: string; texto: string; fecha: string }[];
}
