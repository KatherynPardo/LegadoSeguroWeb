import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';

export interface DatosReclamo {
    tipo: 'RECLAMO' | 'QUEJA';
    nombres: string;
    apellidos: string;
    tipoDocumento: 'DNI' | 'CE' | 'PASAPORTE';
    documento: string;
    correo: string;
    telefono: string;
    direccion: string;
    monto: number | null;
    detalle: string;
    pedido: string;
    autorizaDatos: boolean;
}

export interface ReclamoRegistrado {
    codigo: string;
    correoEnviado: boolean;
}

// Servicio: libro de reclamaciones virtual (público, no necesita sesión)
@Injectable({ providedIn: 'root' })
export class ReclamoService {
    constructor(private http: HttpClient) { }

    enviar(datos: DatosReclamo): Observable<ReclamoRegistrado> {
        return this.http.post<ReclamoRegistrado>(`${API_URL}/reclamos`, datos);
    }
}
