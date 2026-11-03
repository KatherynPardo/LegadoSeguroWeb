import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { DatosRequisito, DocumentoDeHeredero, Requisito } from '../models/documento.model';

// Servicio: checklist de documentos. Lo usan el administrador (catálogo) y el propietario (sus herederos).
@Injectable({ providedIn: 'root' })
export class DocumentoService {
    constructor(private http: HttpClient) { }

    // ---- Administrador ----
    getRequisitos(): Observable<Requisito[]> {
        return this.http.get<Requisito[]>(`${API_URL}/admin/requisitos`);
    }

    crearRequisito(datos: DatosRequisito): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(`${API_URL}/admin/requisitos`, datos);
    }

    editarRequisito(id: number, datos: DatosRequisito, estado: string): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${API_URL}/admin/requisitos/${id}`, { ...datos, estado });
    }

    // ---- Propietario ----
    getDocumentos(idHeredero: number): Observable<DocumentoDeHeredero[]> {
        return this.http.get<DocumentoDeHeredero[]>(`${API_URL}/beneficiarios/${idHeredero}/documentos`);
    }

    guardarDocumentos(idHeredero: number, requisitos: { idRequisito: number; ubicacion: string | null }[]): Observable<{ mensaje: string }> {
        return this.http.put<{ mensaje: string }>(`${API_URL}/beneficiarios/${idHeredero}/documentos`, { requisitos });
    }
}
