import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { ProcesoDetalle, ProcesoResumen } from '../models/proceso.model';

// Servicio: consulta y cancela los procesos de liberación del usuario con sesión
@Injectable({ providedIn: 'root' })
export class ProcesoService {
    private apiUrl = `${API_URL}/procesos`;

    constructor(private http: HttpClient) { }

    getProcesos(): Observable<ProcesoResumen[]> {
        return this.http.get<ProcesoResumen[]>(this.apiUrl);
    }

    getProceso(id: number): Observable<ProcesoDetalle> {
        return this.http.get<ProcesoDetalle>(`${this.apiUrl}/${id}`);
    }

    cancelar(id: number): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.apiUrl}/${id}/cancelar`, {});
    }
}
