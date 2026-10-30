// Resumen del dashboard: mismas claves que devuelve /api/dashboard.
export interface Dashboard {
    activos: number;
    beneficiarios: number;
    reglasActivas: number;
    procesosEnCurso: number;
    actividadReciente: { texto: string; fecha: string }[];
}
