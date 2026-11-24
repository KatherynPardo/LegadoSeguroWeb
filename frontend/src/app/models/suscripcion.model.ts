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
    numeroPedido: number | null;
    comprobante: string | null; // serie y número, por ejemplo B001-00000001
}

// Empresa encontrada por su RUC
export interface EmpresaSunat {
    ruc: string;
    razonSocial: string;
    direccion: string;
    estado: string;
    condicion: string;
}

// Boleta (con el DNI del usuario) o factura (con RUC y razón social)
export interface DatosComprobante {
    tipo: 'BOLETA' | 'FACTURA';
    ruc?: string;
    razonSocial?: string;
}

// Escenarios del ambiente de pruebas de Niubiz: qué tarjeta y qué correo escribir para ver cada resultado
export interface Suscripcion {
    idPlanActual: number | null;
    desde: string | null;
    limiteHerederos: number | null;
    planes: Plan[];
    uso: { activos: number; beneficiarios: number };
    pagos: Pago[];
}

// Datos para armar el formulario de pago de Niubiz (respuesta de /api/suscripcion/pago/iniciar)
export interface PagoIniciado {
    sessionKey: string;
    merchantId: string;
    numeroPedido: number;
    monto: number;
    correo: string | null; // null en el ambiente de pruebas: el formulario lo pide
    pruebas: boolean;
    urlScript: string;
    urlRespuesta: string;
    urlVencido: string;
}

// Resultado de un pago al volver de Niubiz
export interface ResultadoPago {
    estado: string;
    numeroPedido: number;
    mensaje: string;
    plan: string;
    monto: number;
    respuestaNiubiz: { codigo: string; descripcion: string; categoria: string | null } | null;
    fecha: string;
    tarjeta: string | null;
    marca: string | null;
    codigoAutorizacion: string | null;
    comprobante: { tipo: string; numero: string } | null;
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
