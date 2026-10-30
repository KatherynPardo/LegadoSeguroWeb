import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Activo, NuevoActivo } from '../models/activo.model';

// Servicio: se encarga de pedirle los activos al backend Express
@Injectable({ providedIn: 'root' })
export class ActivoService {
    private apiUrl = `${API_URL}/activos`;

    constructor(private http: HttpClient) { }

    getActivos(): Observable<Activo[]> {
        return this.http.get<Activo[]>(this.apiUrl);
    }

    crearActivo(datos: NuevoActivo): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, datos);
    }
}
