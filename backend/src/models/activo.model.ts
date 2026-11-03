// Heredero asignado a un activo
export type HeredAsignado = {
  id: number;
  nombre: string;
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
};

export type NuevoActivo = DatosActivo & { beneficiarios: number[] };

export type MontoHistorico = {
  fecha: string;
  monto: number;
  moneda: string;
  usuario: string;
};
