import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Accesibilidad } from './components/accesibilidad/accesibilidad';
import { Asistente } from './components/asistente/asistente';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Accesibilidad, Asistente],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(protected auth: AuthService) {}

  // "Saltar al contenido": lleva el foco del teclado al contenido principal, sin cambiar de ruta
  saltar(evento: Event): void {
    evento.preventDefault();
    document.getElementById('contenido')?.focus();
  }
}
