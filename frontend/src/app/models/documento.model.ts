// ---- Administrador: catálogo de requisitos ----
export interface Requisito {
    id: number;
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    estado: string;
}

export interface DatosRequisito {
    nombre: string;
    descripcion: string;
    obligatorio: boolean;
}

// ---- Propietario: documentos de un heredero ----
export interface DocumentoDeHeredero {
    id: number; // id del requisito
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    asignado: boolean;
    estado: string | null;
    ubicacion: string | null;
}

// ---- Heredero: su checklist en el portal ----
export interface DocumentoChecklist {
    id: number;
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    estado: string; // 'PENDIENTE' | 'ENTREGADO'
    ubicacion: string | null;
}

export interface ChecklistHeredero {
    idBeneficiario: number;
    heredero: string;
    benefactor: string;
    documentos: DocumentoChecklist[];
}

export interface SesionPortal {
    token: string;
    heredero: { correo: string; nombres: string };
}
