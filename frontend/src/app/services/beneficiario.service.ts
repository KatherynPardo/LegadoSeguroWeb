import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Beneficiario, NuevoBeneficiario, PersonaDni } from '../models/beneficiario.model';

// Servicio: se encarga de pedirle los beneficiarios al backend Express
@Injectable({ providedIn: 'root' })
export class BeneficiarioService {
    private apiUrl = `${API_URL}/beneficiarios`;

    constructor(private http: HttpClient) { }

    getBeneficiarios(): Observable<Beneficiario[]> {
        return this.http.get<Beneficiario[]>(this.apiUrl);
    }

    crearBeneficiario(datos: NuevoBeneficiario): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, datos);
    }

    // Consulta los nombres de una persona por su DNI (el backend habla con el servicio externo)
    buscarDni(dni: string): Observable<PersonaDni> {
        return this.http.get<PersonaDni>(`${API_URL}/reniec/dni/${dni}`);
    }
}
