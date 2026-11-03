// Una acción o ingreso del usuario (viene de /api/historial)
export interface RegistroHistorial {
    fecha: string;
    accion: string;
    descripcion: string | null;
    ipOrigen: string | null;
}
