// Tipo de activo (red social, cuenta bancaria...) con su nivel de sensibilidad.
export type TipoActivo = {
  id: number;
  nombre: string;
  sensibilidad: string; // 'BAJA' o 'FINANCIERA'
};
