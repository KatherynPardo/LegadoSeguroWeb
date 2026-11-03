// Un paso del plan para completar el legado (por ejemplo "Asigna herederos a tus activos")
export type PasoSalud = {
  texto: string;
  hecho: boolean;
  ruta: string; // pantalla donde se resuelve
};

// Resumen que muestra el dashboard: cifras, salud del legado, regla en acción y actividad.
export type Dashboard = {
  activos: number;
  beneficiarios: number;
  reglasActivas: number;
  procesosEnCurso: number;
  salud: { puntaje: number; pasos: PasoSalud[] };
  inactividad: {
    limiteDias: number | null;        // días de inactividad de la regla activa
    diasDesdeIngresoAnterior: number | null; // null si es su primer ingreso
  };
  actividadReciente: { tipo: string; texto: string; fecha: string }[];
};
