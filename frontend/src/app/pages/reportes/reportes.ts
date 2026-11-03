import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SuscripcionService } from '../../services/suscripcion.service';
import { Reporte } from '../../models/suscripcion.model';

@Component({
  selector: 'app-reportes',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  reporte = signal<Reporte | null>(null);

  // El dinero registrado empieza oculto; el ojito lo muestra u oculta
  verMontos = signal(false);

  // Nombres entendibles para los estados de un proceso
  estados: Record<string, string> = {
    DETECTADO: 'Detectado',
    EN_CONFIRMACION: 'En confirmación',
    EN_ESPERA: 'En espera final',
    LIBERADO: 'Liberado',
    CANCELADO: 'Cancelado'
  };

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit(): void {
    this.suscripcionService.getReporte().subscribe(data => this.reporte.set(data));
  }

  simbolo(moneda: string): string {
    return moneda === 'USD' ? 'US$' : 'S/';
  }

  // Ancho de la barra de cada tipo, en porcentaje del total de activos
  ancho(cantidad: number, total: number): number {
    return total === 0 ? 0 : Math.round((cantidad / total) * 100);
  }
}
