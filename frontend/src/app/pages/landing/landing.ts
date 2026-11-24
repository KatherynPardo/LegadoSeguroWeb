import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Logo } from '../../components/logo/logo';
import { CONTACTO } from '../../core/legal';
import { SuscripcionService } from '../../services/suscripcion.service';
import { Plan } from '../../models/suscripcion.model';

// Página de inicio pública: explica qué es LegadoSeguro, cómo protege los datos y cuánto cuesta.
@Component({
  selector: 'app-landing',
  imports: [RouterLink, DecimalPipe, Logo],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit {
  contacto = CONTACTO; // se cambia en core/legal.ts
  anio = new Date().getFullYear();
  planes = signal<Plan[]>([]);

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit(): void {
    // Si la consulta falla, la página se ve igual y la sección de planes invita a crear la cuenta
    this.suscripcionService.getPlanes().subscribe({ next: p => this.planes.set(p), error: () => this.planes.set([]) });
  }

  // Desplazamiento suave a una sección de la misma página
  ir(evento: Event, id: string): void {
    evento.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
