import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';

export interface TemaAsistente {
    id: number;
    tema: string;
}

export interface RespuestaAsistente extends TemaAsistente {
    contenido: string;
}

// Lo que devuelve /api/asistente/preguntar: la respuesta (o null), temas relacionados y, si no hubo
// coincidencia, la lista de temas disponibles
export interface ResultadoAsistente {
    respuesta: RespuestaAsistente | null;
    relacionados: TemaAsistente[];
    temas: TemaAsistente[];
}

// Servicio: preguntas al asistente virtual de orientación (público, no necesita sesión)
@Injectable({ providedIn: 'root' })
export class AsistenteService {
    private apiUrl = `${API_URL}/asistente`;

    constructor(private http: HttpClient) { }

    getTemas(): Observable<TemaAsistente[]> {
        return this.http.get<TemaAsistente[]>(`${this.apiUrl}/temas`);
    }

    preguntar(pregunta: string): Observable<ResultadoAsistente> {
        return this.http.post<ResultadoAsistente>(`${this.apiUrl}/preguntar`, { pregunta });
    }

    verTema(idTema: number): Observable<ResultadoAsistente> {
        return this.http.post<ResultadoAsistente>(`${this.apiUrl}/preguntar`, { idTema });
    }
}
