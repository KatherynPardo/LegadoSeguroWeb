import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { AlertaInactividad, RegistroAuditoria, ResumenMonitoreo, UsuarioAdmin } from '../models/auth.model';

// Servicio: administración de usuarios (solo rol ADMINISTRADOR)
@Injectable({ providedIn: 'root' })
export class AdminService {
    private apiUrl = `${API_URL}/admin`;

    constructor(private http: HttpClient) { }

    getUsuarios(): Observable<UsuarioAdmin[]> {
        return this.http.get<UsuarioAdmin[]>(`${this.apiUrl}/usuarios`);
    }

    getAuditoria(): Observable<RegistroAuditoria[]> {
        return this.http.get<RegistroAuditoria[]>(`${this.apiUrl}/auditoria`);
    }

    getAlertas(): Observable<AlertaInactividad[]> {
        return this.http.get<AlertaInactividad[]>(`${this.apiUrl}/alertas`);
    }

    // Revisa ahora mismo la inactividad de todos los usuarios, sin esperar la revisión de cada hora
    ejecutarMonitoreo(): Observable<ResumenMonitoreo> {
        return this.http.post<ResumenMonitoreo>(`${this.apiUrl}/monitoreo/ejecutar`, {});
    }

    // Solo para pruebas: vence ya el plazo de una alerta
    adelantarAlerta(id: number): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.apiUrl}/alertas/${id}/adelantar`, {});
    }

    cambiarEstado(id: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<{ mensaje: string }> {
        return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}/estado`, { estado });
    }
}
