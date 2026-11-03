import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SuscripcionService } from '../../services/suscripcion.service';
import { Plan, Suscripcion as DatosSuscripcion } from '../../models/suscripcion.model';

@Component({
  selector: 'app-suscripcion',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './suscripcion.html',
  styleUrl: './suscripcion.css'
})
export class Suscripcion implements OnInit {
  datos = signal<DatosSuscripcion | null>(null);
  mensaje = signal('');
  error = signal('');

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.suscripcionService.getSuscripcion().subscribe(data => this.datos.set(data));
  }

  esActual(plan: Plan): boolean {
    return plan.id === this.datos()?.idPlanActual;
  }

  planActual(): Plan | undefined {
    return this.datos()?.planes.find(p => p.id === this.datos()?.idPlanActual);
  }

  elegir(plan: Plan): void {
    this.mensaje.set('');
    this.error.set('');

    this.suscripcionService.elegirPlan(plan.id).subscribe({
      next: r => {
        this.mensaje.set(r.mensaje);
        this.cargar();
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo cambiar el plan')
    });
  }
}
