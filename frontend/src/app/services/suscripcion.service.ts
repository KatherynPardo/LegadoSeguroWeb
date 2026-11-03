import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Reporte, Suscripcion } from '../models/suscripcion.model';

// Servicio: planes, suscripción y reportes del usuario con sesión
@Injectable({ providedIn: 'root' })
export class SuscripcionService {
    constructor(private http: HttpClient) { }

    getSuscripcion(): Observable<Suscripcion> {
        return this.http.get<Suscripcion>(`${API_URL}/suscripcion`);
    }

    elegirPlan(idPlan: number): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${API_URL}/suscripcion/plan`, { idPlan });
    }

    getReporte(): Observable<Reporte> {
        return this.http.get<Reporte>(`${API_URL}/reportes`);
    }
}
