import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProcesoService } from '../../services/proceso.service';
import { ProcesoDetalle, ProcesoResumen } from '../../models/proceso.model';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-procesos',
  imports: [DatePipe, Modal],
  templateUrl: './procesos.html',
  styleUrl: './procesos.css'
})
export class Procesos implements OnInit {
  procesos = signal<ProcesoResumen[]>([]);
  cargado = signal(false);

  detalle = signal<ProcesoDetalle | null>(null);
  porCancelar = signal<ProcesoResumen | null>(null);
  mensaje = signal('');
  error = signal('');

  constructor(private procesoService: ProcesoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.procesoService.getProcesos().subscribe(data => {
      this.procesos.set(data);
      this.cargado.set(true);
    });
  }

  // Un proceso sigue abierto mientras no tenga fecha de fin
  abierto(p: ProcesoResumen): boolean {
    return p.fechaFin === null;
  }

  etiqueta(estado: string): string {
    const etiquetas: Record<string, string> = {
      DETECTADO: 'Inactividad detectada',
      EN_CONFIRMACION: 'En confirmación',
      EN_ESPERA: 'En período de espera',
      LIBERADO: 'Liberado',
      CANCELADO: 'Cancelado'
    };
    return etiquetas[estado] ?? estado;
  }

  verDetalle(p: ProcesoResumen): void {
    this.procesoService.getProceso(p.id).subscribe(d => this.detalle.set(d));
  }

  pedirCancelar(p: ProcesoResumen): void {
    this.mensaje.set('');
    this.error.set('');
    this.porCancelar.set(p);
  }

  confirmarCancelar(): void {
    const p = this.porCancelar();
    if (!p) return;

    this.procesoService.cancelar(p.id).subscribe({
      next: () => {
        this.porCancelar.set(null);
        this.mensaje.set('Proceso cancelado. Tus activos siguen bajo tu control.');
        this.cargar();
      },
      error: err => {
        this.porCancelar.set(null);
        this.error.set(err.error?.mensaje ?? 'No se pudo cancelar el proceso');
      }
    });
  }
}
