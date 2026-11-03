// Heredero asignado a un activo
export interface HeredAsignado {
    id: number;
    nombre: string;
}

// Datos de una tarjeta: solo los 4 últimos dígitos (nunca el número completo, el CVV ni la clave)
export interface DatosTarjeta {
    ultimos4: string;
    diaPago: number | null;
    diaCierre: number | null;
}

// Molde de un activo digital: mismas columnas que devuelve /api/activos.
export interface Activo {
    id: number;
    nombre: string;
    descripcion: string | null;
    idTipo: number;
    tipo: string;
    sensibilidad: string;
    estado: string;
    idEntidad: number | null;
    entidad: string | null;
    registrarMonto: boolean;
    moneda: string | null;
    monto: number | null;
    indicaciones: string | null;
    tarjeta: DatosTarjeta | null;
    herederos: HeredAsignado[];
}

// Datos del formulario para crear o editar un activo
export interface DatosActivo {
    nombre: string;
    descripcion: string;
    id_tipo: number;
    id_entidad: number | null;
    registrar_monto: boolean;
    moneda: 'PEN' | 'USD';
    monto: number | null;
    indicaciones: string;
    tarjeta: DatosTarjeta | null;
}

export interface NuevoActivo extends DatosActivo {
    beneficiarios: number[];
}

// Tipo de activo con su sensibilidad (viene de /api/tipos-activo)
export interface TipoActivo {
    id: number;
    nombre: string;
    sensibilidad: string;
    requiereEntidad: boolean;
    esTarjeta: boolean;
    esCredito: boolean;
    guiaIndicaciones: string | null;
}

// Banco o entidad financiera
export interface Entidad {
    id: number;
    nombre: string;
}

// Un monto guardado en el historial de un activo
export interface MontoHistorico {
    fecha: string;
    monto: number;
    moneda: string;
    usuario: string;
}
