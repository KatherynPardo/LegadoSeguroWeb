// Molde de un beneficiario: mismas columnas que devuelve la API.
export interface Beneficiario {
    id: number;
    nombres: string;
    apellidos: string;
    parentesco: string;
    correo: string | null;
}

// Datos del formulario para registrar un beneficiario
export interface NuevoBeneficiario {
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    parentesco: string;
    claveAcceso: string;
}

// Persona devuelta por la consulta de DNI
export interface PersonaDni {
    dni: string;
    nombres: string;
    apellidos: string;
}
