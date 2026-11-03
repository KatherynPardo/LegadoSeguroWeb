// Heredero asignado a un activo
export type HeredAsignado = {
  id: number;
  nombre: string;
};

// Datos de una tarjeta: solo los 4 últimos dígitos (nunca el número completo, el CVV ni la clave).
export type DatosTarjeta = {
  ultimos4: string;
  linea: number | null;      // línea de crédito (solo tarjetas de crédito)
  diaPago: number | null;    // día del mes en que vence el pago
  diaCierre: number | null;  // día del mes en que cierra la facturación
};

// Molde de un activo digital: lo que devuelve la API (incluye tipo, banco, monto, tarjeta y herederos).
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
  indicaciones: string | null;
  tarjeta: DatosTarjeta | null;
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
  indicaciones: string | null;
  tarjeta: DatosTarjeta | null;
};

export type NuevoActivo = DatosActivo & { beneficiarios: number[] };

export type MontoHistorico = {
  fecha: string;
  monto: number;
  moneda: string;
  usuario: string;
};
