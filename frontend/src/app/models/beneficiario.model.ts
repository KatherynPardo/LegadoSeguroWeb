// Molde de un beneficiario: mismas columnas que devuelve la API.
export interface Beneficiario {
    id: number;
    nombres: string;
    apellidos: string;
    parentesco: string;
    correo: string | null;
}
