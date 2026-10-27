// Molde de un beneficiario: lo que devuelve la API (mismas columnas que la consulta).
export type Beneficiario = {
  id: number;
  nombres: string;
  apellidos: string;
  parentesco: string | null;
  correo: string;
};
