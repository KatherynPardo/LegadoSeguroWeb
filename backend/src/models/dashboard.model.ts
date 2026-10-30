// Resumen que muestra el dashboard: cifras y últimos activos registrados.
export type Dashboard = {
  activos: number;
  beneficiarios: number;
  reglasActivas: number;
  procesosEnCurso: number;
  actividadReciente: { texto: string; fecha: string }[];
};
