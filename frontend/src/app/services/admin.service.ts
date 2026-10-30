import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { UsuarioAdmin } from '../models/auth.model';

// Servicio: administración de usuarios (solo rol ADMINISTRADOR)
@Injectable({ providedIn: 'root' })
export class AdminService {
    private apiUrl = `${API_URL}/admin`;

    constructor(private http: HttpClient) { }

    getUsuarios(): Observable<UsuarioAdmin[]> {
        return this.http.get<UsuarioAdmin[]>(`${this.apiUrl}/usuarios`);
    }

    cambiarEstado(id: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<{ mensaje: string }> {
        return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}/estado`, { estado });
    }
}
