// Molde de un beneficiario: lo que devuelve la API (mismas columnas que la consulta).
export type Beneficiario = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  parentesco: string | null;
  correo: string;
  telefono: string | null;
};

// Datos que llegan desde el formulario para registrar un beneficiario.
export type NuevoBeneficiario = {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string;
  parentesco: string;
  claveAcceso: string; // se guarda cifrada (hash), nunca en texto plano
  codigo: string; // código de 6 dígitos que le llegó al correo del heredero
};

// Datos editables de un beneficiario (el DNI no cambia). La clave solo se cambia si se envía una nueva.
export type EdicionBeneficiario = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  parentesco: string;
  claveAcceso: string | null;
  codigo: string | null; // solo hace falta si cambia el correo
};
