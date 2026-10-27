import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Beneficiario } from '../models/beneficiario.model';

// Servicio: se encarga de pedirle los beneficiarios al backend Express
@Injectable({ providedIn: 'root' })
export class BeneficiarioService {
    private apiUrl = `${API_URL}/beneficiarios`;

    constructor(private http: HttpClient) { }

    getBeneficiarios(): Observable<Beneficiario[]> {
        return this.http.get<Beneficiario[]>(this.apiUrl);
    }
}
