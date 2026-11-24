import { Component, HostListener, signal } from '@angular/core';
import { AccesibilidadService, ESCALAS } from '../../services/accesibilidad.service';

// Botón flotante con las opciones de accesibilidad: tema, tamaño de letra, alto contraste y lectura en voz alta.
@Component({
  selector: 'app-accesibilidad',
  templateUrl: './accesibilidad.html',
  styleUrl: './accesibilidad.css'
})
export class Accesibilidad {
  abierto = signal(false);
  minimo = ESCALAS[0];
  maximo = ESCALAS[ESCALAS.length - 1];

  constructor(protected a: AccesibilidadService) {}

  @HostListener('document:keydown.escape')
  cerrar(): void {
    this.abierto.set(false);
  }
}
