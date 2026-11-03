// Molde de un beneficiario: lo que devuelve la API (mismas columnas que la consulta).
export type Beneficiario = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  parentesco: string | null;
  correo: string;
  telefono: string | null;
  verificado: boolean; // true si el heredero confirmó su correo con un código
  activos: { id: number; nombre: string }[]; // activos que recibirá
};

// Datos que llegan desde el formulario para registrar un beneficiario.
export type NuevoBeneficiario = {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string;
  parentesco: string;
  codigo: string; // código de 6 dígitos que le llegó al correo del heredero
  activos: number[]; // activos que recibirá
};

// Datos editables de un beneficiario (el DNI no cambia).
export type EdicionBeneficiario = {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  parentesco: string;
  codigo: string | null; // solo hace falta si cambia el correo
  activos: number[] | null; // si se envía, reemplaza los activos que recibe
};
