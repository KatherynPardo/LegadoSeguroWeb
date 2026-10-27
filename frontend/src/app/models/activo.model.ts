// Molde de un activo digital: mismas columnas que devuelve /api/activos.
export interface Activo {
    id: number;
    nombre: string;
    descripcion: string | null;
    tipo: string;
    sensibilidad: string;
    estado: string;
}
