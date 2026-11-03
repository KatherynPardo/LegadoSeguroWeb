// ---- Administrador: catálogo de requisitos ----
export interface Requisito {
    id: number;
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    estado: string;
    tipos: number[];
}

export interface DatosRequisito {
    nombre: string;
    descripcion: string;
    obligatorio: boolean;
    tipos: number[]; // tipos de activo a los que aplica (vacío = todos)
}

// ---- Propietario: documentos de un heredero ----
export interface DocumentoDeHeredero {
    id: number; // id del requisito
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    estado: string;
    ubicacion: string | null;
    aplicaA: string[]; // activos que motivan este documento (vacío = aplica a todos)
}

// ---- Heredero: su checklist en el portal ----
export interface DocumentoChecklist {
    id: number;
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    estado: string; // 'PENDIENTE' | 'ENTREGADO'
    ubicacion: string | null;
    aplicaA: string[];
}

export interface ChecklistHeredero {
    idBeneficiario: number;
    heredero: string;
    benefactor: string;
    documentos: DocumentoChecklist[];
}

// Solicitud de liberación que ve el heredero (pantalla del Figma 06)
export interface EntregaHeredero {
    activo: string;
    tipo: string;
    estado: string; // 'AUTORIZADA' | 'PENDIENTE_VALIDADOR'
    detalle: string | null;
    indicaciones: string | null;
}

export interface Solicitud {
    idProceso: number;
    idBeneficiario: number;
    estado: string;
    fechaFin: string | null;
    benefactor: string;
    minConfirmaciones: number;
    confirmaron: number;
    diasEspera: number;
    dniValidado: boolean;
    selfieTomada: boolean;
    confirmado: boolean;
    objetado: boolean;
    activos: number;
    entregas: EntregaHeredero[];
}

export interface SesionPortal {
    token: string;
    heredero: { correo: string; nombres: string };
}
