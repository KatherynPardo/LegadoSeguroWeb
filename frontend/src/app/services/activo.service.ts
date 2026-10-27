import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Activo } from '../models/activo.model';

// Servicio: se encarga de pedirle los activos al backend Express
@Injectable({ providedIn: 'root' })
export class ActivoService {
    private apiUrl = `${API_URL}/activos`;

    constructor(private http: HttpClient) { }

    getActivos(): Observable<Activo[]> {
        return this.http.get<Activo[]>(this.apiUrl);
    }
}
