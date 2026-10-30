import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { ActualizarPerfil, CambiarPassword, Perfil } from '../models/perfil.model';

// Servicio: consulta y edita el perfil del usuario con sesión iniciada
@Injectable({ providedIn: 'root' })
export class PerfilService {
    private apiUrl = `${API_URL}/perfil`;

    constructor(private http: HttpClient) { }

    getPerfil(): Observable<Perfil> {
        return this.http.get<Perfil>(this.apiUrl);
    }

    actualizar(datos: ActualizarPerfil): Observable<Perfil> {
        return this.http.put<Perfil>(this.apiUrl, datos);
    }

    cambiarPassword(datos: CambiarPassword): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/password`, datos);
    }
}
