import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortalService } from '../../services/portal.service';
import { Solicitud as DatosSolicitud } from '../../models/documento.model';
import { Modal } from '../modal/modal';

// Solicitud de liberación que ve el heredero (Figma 06): tres verificaciones y la decisión final.
@Component({
  selector: 'app-solicitud',
  imports: [FormsModule, Modal],
  templateUrl: './solicitud.html',
  styleUrl: './solicitud.css'
})
export class Solicitud {
  solicitud = input.required<DatosSolicitud>();
  cambio = output<void>(); // avisa a la pantalla que debe volver a pedir los datos

  dni = '';
  dniEnmascarado = signal('');
  nombre = signal('');
  vistaPrevia = signal('');
  error = signal('');
  cargando = signal(false);

  mostrarObjecion = signal(false);
  motivo = '';
  errorObjecion = signal('');

  constructor(private portal: PortalService) {}

  // Paso 2: comparar el DNI escrito con el que registró el propietario
  validarDni(): void {
    this.error.set('');
    this.cargando.set(true);

    this.portal.validarDni(this.solicitud(), this.dni).subscribe({
      next: r => {
        this.cargando.set(false);
        this.nombre.set(r.nombre);
        this.dniEnmascarado.set(r.dni);
        this.cambio.emit();
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo validar el DNI');
      }
    });
  }

  // Paso 3: la foto se reduce a un tamaño pequeño y se envía
  async elegirFoto(evento: Event): Promise<void> {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.error.set('');
    this.cargando.set(true);

    try {
      const imagen = await this.reducir(archivo);
      this.vistaPrevia.set(imagen);
      this.portal.enviarSelfie(this.solicitud(), imagen).subscribe({
        next: () => {
          this.cargando.set(false);
          this.cambio.emit();
        },
        error: err => {
          this.cargando.set(false);
          this.error.set(err.error?.mensaje ?? 'No se pudo enviar la foto');
        }
      });
    } catch {
      this.cargando.set(false);
      this.error.set('No se pudo leer la foto. Prueba con otra imagen.');
    }
  }

  // Dibuja la foto en un lienzo de máximo 480 píxeles y la guarda como JPEG liviano
  private async reducir(archivo: File): Promise<string> {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, 480 / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return lienzo.toDataURL('image/jpeg', 0.7);
  }

  pasosCompletos(): boolean {
    return this.solicitud().dniValidado && this.solicitud().selfieTomada;
  }

  confirmar(): void {
    this.error.set('');
    this.cargando.set(true);

    this.portal.confirmarParticipacion(this.solicitud()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.cambio.emit();
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo confirmar');
      }
    });
  }

  abrirObjecion(): void {
    this.motivo = '';
    this.errorObjecion.set('');
    this.mostrarObjecion.set(true);
  }

  enviarObjecion(): void {
    this.errorObjecion.set('');

    this.portal.presentarObjecion(this.solicitud(), this.motivo).subscribe({
      next: () => {
        this.mostrarObjecion.set(false);
        this.cambio.emit();
      },
      error: err => this.errorObjecion.set(err.error?.mensaje ?? 'No se pudo registrar la objeción')
    });
  }

  etiquetaEntrega(estado: string): string {
    return estado === 'AUTORIZADA' ? 'Autorizado' : 'En espera de aprobación del validador';
  }
}
