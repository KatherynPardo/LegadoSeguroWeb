// Molde de un beneficiario: mismas columnas que devuelve la API.
export interface Beneficiario {
    id: number;
    nombres: string;
    apellidos: string;
    dni: string;
    parentesco: string | null;
    correo: string | null;
    telefono: string | null;
}

// Datos del formulario para registrar o editar un beneficiario
export interface NuevoBeneficiario {
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    telefono: string;
    parentesco: string;
    claveAcceso: string;
    codigo: string; // código que le llegó al correo del heredero
}

// Persona devuelta por la consulta de DNI
export interface PersonaDni {
    dni: string;
    nombres: string;
    apellidos: string;
}
