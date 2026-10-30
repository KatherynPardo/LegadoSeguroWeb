// Datos del usuario que inició sesión y respuesta del login.
export interface UsuarioSesion {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
}

export interface Sesion {
    token: string;
    usuario: UsuarioSesion;
}
