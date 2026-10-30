import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { DatosRegla, Regla, ReglaConContexto } from '../models/regla.model';

// Servicio: consulta y guarda la regla de liberación del usuario con sesión
@Injectable({ providedIn: 'root' })
export class ReglaService {
    private apiUrl = `${API_URL}/reglas`;

    constructor(private http: HttpClient) { }

    getRegla(): Observable<ReglaConContexto> {
        return this.http.get<ReglaConContexto>(this.apiUrl);
    }

    guardar(datos: DatosRegla): Observable<Regla> {
        return this.http.put<Regla>(this.apiUrl, datos);
    }
}
