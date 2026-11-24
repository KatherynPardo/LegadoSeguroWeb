import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { DatosComprobante, EmpresaSunat, PagoIniciado, Plan, Reporte, ResultadoPago, Suscripcion } from '../models/suscripcion.model';

// Servicio: planes, suscripción y reportes del usuario con sesión
@Injectable({ providedIn: 'root' })
export class SuscripcionService {
    constructor(private http: HttpClient) { }

    // Planes y precios (público: también se muestran en la página de inicio)
    getPlanes(): Observable<Plan[]> {
        return this.http.get<Plan[]>(`${API_URL}/planes`);
    }

    getSuscripcion(): Observable<Suscripcion> {
        return this.http.get<Suscripcion>(`${API_URL}/suscripcion`);
    }

    elegirPlan(idPlan: number): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${API_URL}/suscripcion/plan`, { idPlan });
    }

    iniciarPago(idPlan: number, aceptoTerminos: boolean, comprobante: DatosComprobante): Observable<PagoIniciado> {
        return this.http.post<PagoIniciado>(`${API_URL}/suscripcion/pago/iniciar`, { idPlan, aceptoTerminos, comprobante });
    }

    // Datos de una empresa a partir de su RUC (SUNAT)
    buscarRuc(ruc: string): Observable<EmpresaSunat> {
        return this.http.get<EmpresaSunat>(`${API_URL}/reniec/ruc/${ruc}`);
    }

    // Boleta o factura en PDF de un pago aprobado
    descargarComprobante(numeroPedido: number): Observable<Blob> {
        return this.http.get(`${API_URL}/suscripcion/pago/${numeroPedido}/comprobante`, { responseType: 'blob' });
    }

    getResultadoPago(numeroPedido: number): Observable<ResultadoPago> {
        return this.http.get<ResultadoPago>(`${API_URL}/suscripcion/pago/${numeroPedido}`);
    }

    getReporte(): Observable<Reporte> {
        return this.http.get<Reporte>(`${API_URL}/reportes`);
    }
}
