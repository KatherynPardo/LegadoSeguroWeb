// Molde de un activo digital: lo que devuelve la API (incluye el nombre de su tipo).
export type Activo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  sensibilidad: string;
  estado: string;
};
