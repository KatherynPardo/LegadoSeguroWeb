// Datos del usuario que inició sesión y respuesta del login.
export interface UsuarioSesion {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
}

export interface Sesion {
    token: string;
    usuario: UsuarioSesion;
}

export interface NuevoUsuario {
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    telefono: string;
    password: string;
}

export interface UsuarioAdmin {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    dni: string;
    rol: string;
    estado: string;
    fechaRegistro: string;
    activos: number;
}
