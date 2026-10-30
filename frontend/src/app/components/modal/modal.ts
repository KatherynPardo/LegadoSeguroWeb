import { Component, input, output } from '@angular/core';

// Ventana emergente reutilizable. Se usa así:
//   <app-modal titulo="..." [abierto]="mostrar()" (cerrar)="mostrar.set(false)"> contenido </app-modal>
@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal {
  titulo = input('');
  abierto = input(false);
  ancho = input(false); // true para contenido grande (por ejemplo, un detalle con tablas)
  cerrar = output<void>();
}
