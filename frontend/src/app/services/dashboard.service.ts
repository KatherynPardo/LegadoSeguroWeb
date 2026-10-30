import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Dashboard } from '../models/dashboard.model';

// Servicio: pide el resumen del dashboard al backend Express
@Injectable({ providedIn: 'root' })
export class DashboardService {
    private apiUrl = `${API_URL}/dashboard`;

    constructor(private http: HttpClient) { }

    getResumen(): Observable<Dashboard> {
        return this.http.get<Dashboard>(this.apiUrl);
    }
}
