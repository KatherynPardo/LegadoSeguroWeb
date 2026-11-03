import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../core/api.config';
import { ChecklistHeredero, SesionPortal, Solicitud } from '../models/documento.model';

const CLAVE_TOKEN = 'lg_portal_token';
const CLAVE_HEREDERO = 'lg_portal_heredero';

// Servicio del portal del heredero. Tiene su propia sesión, separada de la del propietario,
// para que nunca se mezclen (se guardan en otras claves del navegador).
@Injectable({ providedIn: 'root' })
export class PortalService {
    private apiUrl = `${API_URL}/portal`;

    heredero = signal<SesionPortal['heredero'] | null>(this.leerHeredero());
    ingresado = computed(() => this.heredero() !== null);

    constructor(private http: HttpClient, private router: Router) { }

    pedirCodigo(correo: string): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.apiUrl}/codigo`, { correo });
    }

    entrar(correo: string, codigo: string): Observable<SesionPortal> {
        return this.http.post<SesionPortal>(`${this.apiUrl}/entrar`, { correo, codigo }).pipe(
            tap(sesion => {
                localStorage.setItem(CLAVE_TOKEN, sesion.token);
                localStorage.setItem(CLAVE_HEREDERO, JSON.stringify(sesion.heredero));
                this.heredero.set(sesion.heredero);
            })
        );
    }

    getChecklist(): Observable<ChecklistHeredero[]> {
        return this.http.get<ChecklistHeredero[]>(`${this.apiUrl}/checklist`);
    }

    // ---- Solicitudes de liberación ----
    getSolicitudes(): Observable<Solicitud[]> {
        return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes`);
    }

    validarDni(s: Solicitud, dni: string): Observable<{ nombre: string; dni: string }> {
        return this.http.post<{ nombre: string; dni: string }>(`${this.apiUrl}/solicitudes/${s.idProceso}/${s.idBeneficiario}/dni`, { dni });
    }

    enviarSelfie(s: Solicitud, imagen: string): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.apiUrl}/solicitudes/${s.idProceso}/${s.idBeneficiario}/selfie`, { imagen });
    }

    confirmarParticipacion(s: Solicitud): Observable<{ estadoProceso: string }> {
        return this.http.post<{ estadoProceso: string }>(`${this.apiUrl}/solicitudes/${s.idProceso}/${s.idBeneficiario}/confirmar`, {});
    }

    presentarObjecion(s: Solicitud, motivo: string): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.apiUrl}/solicitudes/${s.idProceso}/${s.idBeneficiario}/objecion`, { motivo });
    }

    marcar(idBeneficiario: number, idRequisito: number, entregado: boolean): Observable<{ mensaje: string }> {
        return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/documentos/${idBeneficiario}/${idRequisito}`, { entregado });
    }

    salir(): void {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_HEREDERO);
        this.heredero.set(null);
        this.router.navigate(['/portal']);
    }

    getToken(): string | null {
        return localStorage.getItem(CLAVE_TOKEN);
    }

    private leerHeredero(): SesionPortal['heredero'] | null {
        try {
            const texto = localStorage.getItem(CLAVE_HEREDERO);
            return texto && localStorage.getItem(CLAVE_TOKEN) ? JSON.parse(texto) : null;
        } catch {
            return null;
        }
    }
}
