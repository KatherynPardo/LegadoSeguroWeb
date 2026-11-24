import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CONTACTO } from '../../core/legal';
import { DatosReclamo, ReclamoRegistrado, ReclamoService } from '../../services/reclamo.service';

// Libro de reclamaciones virtual: hoja de reclamo o queja
@Component({
  selector: 'app-reclamaciones',
  imports: [FormsModule, RouterLink],
  templateUrl: './reclamaciones.html',
  styleUrl: '../privacidad/privacidad.css'
})
export class Reclamaciones {
  contacto = CONTACTO;
  enviando = signal(false);
  error = signal('');
  registrado = signal<ReclamoRegistrado | null>(null);

  hoja: DatosReclamo = this.hojaVacia();

  constructor(private reclamoService: ReclamoService) {}

  enviar(): void {
    if (this.enviando()) return;
    this.error.set('');
    this.enviando.set(true);

    this.reclamoService.enviar(this.hoja).subscribe({
      next: r => {
        this.registrado.set(r);
        this.enviando.set(false);
        this.hoja = this.hojaVacia();
      },
      error: err => {
        this.error.set(err.status === 429 ? 'Enviaste varias hojas seguidas. Espera un minuto e inténtalo de nuevo.' : (err.error?.mensaje ?? 'No se pudo registrar tu hoja de reclamación'));
        this.enviando.set(false);
      }
    });
  }

  otraHoja(): void {
    this.registrado.set(null);
  }

  private hojaVacia(): DatosReclamo {
    return {
      tipo: 'RECLAMO', nombres: '', apellidos: '', tipoDocumento: 'DNI', documento: '', correo: '', telefono: '',
      direccion: '', monto: null, detalle: '', pedido: '', autorizaDatos: false
    };
  }
}
