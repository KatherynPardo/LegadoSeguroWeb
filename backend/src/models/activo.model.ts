// Heredero asignado a un activo
export type HeredAsignado = {
  id: number;
  nombre: string;
};

// Método de ahorro del usuario y el rango de dinero que espera ahorrar con ese método
export const METODOS_AHORRO = ['LIBRE', 'MENSUAL_FIJO', 'QUINCENAL_FIJO', 'PORCENTAJE_SUELDO', 'META'];

export type Ahorro = {
  metodo: string;
  min: number | null;
  max: number | null;
};

// Molde de un activo digital: lo que devuelve la API (incluye tipo, banco, monto y herederos).
export type Activo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  idTipo: number;
  tipo: string;
  sensibilidad: string;
  estado: string;
  idEntidad: number | null;
  entidad: string | null;
  registrarMonto: boolean;
  moneda: string | null;
  monto: number | null;
  ahorro: Ahorro | null;
  herederos: HeredAsignado[];
};

// Datos validados para crear o editar un activo.
export type DatosActivo = {
  nombre: string;
  descripcion: string;
  id_tipo: number;
  id_entidad: number | null;
  registrar_monto: boolean;
  moneda: 'PEN' | 'USD' | null;
  monto: number | null;
  ahorro: Ahorro | null;
};

export type NuevoActivo = DatosActivo & { beneficiarios: number[] };

export type MontoHistorico = {
  fecha: string;
  monto: number;
  moneda: string;
  usuario: string;
};
