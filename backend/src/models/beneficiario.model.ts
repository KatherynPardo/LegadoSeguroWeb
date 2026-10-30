// Molde de un beneficiario: lo que devuelve la API (mismas columnas que la consulta).
export type Beneficiario = {
  id: number;
  nombres: string;
  apellidos: string;
  parentesco: string | null;
  correo: string;
};

// Datos que llegan desde el formulario para registrar un beneficiario.
export type NuevoBeneficiario = {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  parentesco?: string;
  claveAcceso: string; // se guarda cifrada (hash), nunca en texto plano
};
