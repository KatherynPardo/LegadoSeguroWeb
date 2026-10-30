// Perfil del usuario que inició sesión (mismas claves que devuelve /api/perfil).
export interface Perfil {
    id: number;
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    telefono: string | null;
}

// Datos editables del perfil (el DNI no se modifica)
export interface ActualizarPerfil {
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
}

export interface CambiarPassword {
    actual: string;
    nueva: string;
}
