import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../core/api.config';
import { NuevoUsuario, Sesion, UsuarioSesion } from '../models/auth.model';
import { PersonaDni } from '../models/beneficiario.model';

const CLAVE_TOKEN = 'lg_token';
const CLAVE_USUARIO = 'lg_usuario';

// Servicio de sesión: inicia y cierra sesión, y guarda el token en el navegador.
@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = `${API_URL}/auth`;

    usuario = signal<UsuarioSesion | null>(this.leerUsuario());
    logueado = computed(() => this.usuario() !== null);
    esAdmin = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');

    constructor(private http: HttpClient, private router: Router) { }

    login(correo: string, password: string): Observable<Sesion> {
        return this.http.post<Sesion>(`${this.apiUrl}/login`, { correo, password }).pipe(
            tap(sesion => this.guardarSesion(sesion))
        );
    }

    // Crea la cuenta y deja la sesión iniciada
    registrar(datos: NuevoUsuario): Observable<Sesion> {
        return this.http.post<Sesion>(`${this.apiUrl}/registro`, datos).pipe(
            tap(sesion => this.guardarSesion(sesion))
        );
    }

    // Consulta pública de DNI para el registro (los datos vienen de RENIEC)
    buscarDni(dni: string): Observable<PersonaDni> {
        return this.http.get<PersonaDni>(`${this.apiUrl}/dni/${dni}`);
    }

    private guardarSesion(sesion: Sesion): void {
        localStorage.setItem(CLAVE_TOKEN, sesion.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
        this.usuario.set(sesion.usuario);
    }

    logout(): void {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
        this.usuario.set(null);
        this.router.navigate(['/login']);
    }

    // Actualiza el nombre que se muestra en el menú después de editar el perfil
    actualizarUsuario(cambios: Partial<UsuarioSesion>): void {
        const usuario = { ...this.usuario()!, ...cambios };
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
        this.usuario.set(usuario);
    }

    getToken(): string | null {
        return localStorage.getItem(CLAVE_TOKEN);
    }

    private leerUsuario(): UsuarioSesion | null {
        try {
            const texto = localStorage.getItem(CLAVE_USUARIO);
            return texto && localStorage.getItem(CLAVE_TOKEN) ? JSON.parse(texto) : null;
        } catch {
            return null;
        }
    }
}
