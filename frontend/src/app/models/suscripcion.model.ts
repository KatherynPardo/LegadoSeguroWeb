// Un plan (Gratuito, Premium...) tal como lo devuelve /api/suscripcion
export interface Plan {
    id: number;
    nombre: string;
    tipo: string;
    precio: number;
    descripcion: string | null;
    limiteHerederos: number | null; // null = sin límite
}

export interface Pago {
    fecha: string;
    monto: number;
    estado: string;
    plan: string;
}

export interface Suscripcion {
    idPlanActual: number | null;
    desde: string | null;
    limiteHerederos: number | null;
    planes: Plan[];
    uso: { activos: number; beneficiarios: number };
    pagos: Pago[];
}

// Resumen de /api/reportes
export interface Reporte {
    totalActivos: number;
    sinHeredero: number;
    porTipo: { tipo: string; sensibilidad: string; cantidad: number }[];
    dinero: { moneda: string; total: number }[];
    herederos: { total: number; verificados: number };
    procesos: { estado: string; cantidad: number }[];
}
