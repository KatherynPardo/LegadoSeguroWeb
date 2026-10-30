// Datos del perfil del usuario que inició sesión.
export type Perfil = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string | null;
};

// Lo que el usuario puede editar de su perfil (el DNI no se modifica).
export type ActualizarPerfil = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
};
