import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Activo, DatosActivo, Entidad, MontoHistorico, NuevoActivo, TipoActivo } from '../models/activo.model';

// Servicio: se encarga de pedirle los activos, bancos y tipos al backend Express
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

    actualizarActivo(id: number, datos: DatosActivo): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarActivo(id: number): Observable<{ mensaje: string }> {
        return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
    }

    // Reemplaza los herederos de un activo por la lista de ids
    asignarHerederos(id: number, beneficiarios: number[]): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${id}/beneficiarios`, { beneficiarios });
    }

    getHistorial(id: number): Observable<MontoHistorico[]> {
        return this.http.get<MontoHistorico[]>(`${this.apiUrl}/${id}/historial`);
    }

    getTipos(): Observable<TipoActivo[]> {
        return this.http.get<TipoActivo[]>(`${API_URL}/tipos-activo`);
    }

    getEntidades(): Observable<Entidad[]> {
        return this.http.get<Entidad[]>(`${API_URL}/entidades`);
    }

    crearEntidad(nombre: string): Observable<Entidad> {
        return this.http.post<Entidad>(`${API_URL}/entidades`, { nombre });
    }
}
