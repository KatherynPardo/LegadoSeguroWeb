// Tipo de activo (red social, cuenta bancaria...) con su nivel de sensibilidad.
export type TipoActivo = {
  id: number;
  nombre: string;
  sensibilidad: string; // 'BAJA' o 'FINANCIERA'
  requiereEntidad: boolean; // true si hay que indicar el banco (cuenta bancaria)
  esTarjeta: boolean;       // true para tarjetas de crédito y de débito
  esCredito: boolean;       // true solo para tarjeta de crédito
  guiaIndicaciones: string | null; // qué conviene indicarle al heredero en este tipo de activo
};
