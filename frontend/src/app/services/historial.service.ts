import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { RegistroHistorial } from '../models/historial.model';

// Servicio: pide el historial del usuario con sesión
@Injectable({ providedIn: 'root' })
export class HistorialService {
    constructor(private http: HttpClient) { }

    getHistorial(): Observable<RegistroHistorial[]> {
        return this.http.get<RegistroHistorial[]>(`${API_URL}/historial`);
    }
}
