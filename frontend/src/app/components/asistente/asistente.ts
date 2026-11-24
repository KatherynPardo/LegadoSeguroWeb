import { Component, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { AsistenteService, RespuestaAsistente, ResultadoAsistente, TemaAsistente } from '../../services/asistente.service';

interface Mensaje {
  autor: 'yo' | 'asistente';
  texto?: string;
  respuesta?: RespuestaAsistente;
  sugerencias?: TemaAsistente[]; // temas que se pueden elegir con un clic
}

// Asistente virtual de orientación: botón flotante con un chat que responde con la guía del sistema.
@Component({
  selector: 'app-asistente',
  templateUrl: './asistente.html',
  styleUrl: './asistente.css'
})
export class Asistente {
  abierto = signal(false);
  mensajes = signal<Mensaje[]>([]);
  pensando = signal(false);

  private historial = viewChild<ElementRef<HTMLElement>>('historial');
  private caja = viewChild<ElementRef<HTMLInputElement>>('caja');

  constructor(private asistente: AsistenteService) {}

  alternar(): void {
    this.abierto.update(a => !a);
    if (!this.abierto()) return;

    if (this.mensajes().length === 0) this.darBienvenida();
    setTimeout(() => this.caja()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  cerrar(): void {
    this.abierto.set(false);
  }

  enviar(evento: Event, entrada: HTMLInputElement): void {
    evento.preventDefault();
    const texto = entrada.value.trim();
    if (texto.length === 0 || this.pensando()) return;

    entrada.value = '';
    this.agregar({ autor: 'yo', texto });
    this.responder(this.asistente.preguntar(texto));
  }

  elegir(tema: TemaAsistente): void {
    if (this.pensando()) return;
    this.agregar({ autor: 'yo', texto: tema.tema });
    this.responder(this.asistente.verTema(tema.id));
  }

  private darBienvenida(): void {
    this.asistente.getTemas().subscribe({
      next: temas => this.agregar({
        autor: 'asistente',
        texto: 'Hola, soy el asistente virtual de LegadoSeguro. Escribe tu pregunta o elige un tema.',
        sugerencias: temas.slice(0, 6)
      }),
      error: () => this.agregar({ autor: 'asistente', texto: 'Hola, soy el asistente virtual de LegadoSeguro. Escribe tu pregunta.' })
    });
  }

  private responder(consulta: ReturnType<AsistenteService['preguntar']>): void {
    this.pensando.set(true);
    consulta.subscribe({
      next: (r: ResultadoAsistente) => {
        this.pensando.set(false);
        if (r.respuesta) {
          this.agregar({ autor: 'asistente', respuesta: r.respuesta, sugerencias: r.relacionados });
        } else {
          this.agregar({ autor: 'asistente', texto: 'No encontré una respuesta para eso. Estos son los temas que sí puedo explicarte:', sugerencias: r.temas });
        }
      },
      error: err => {
        this.pensando.set(false);
        this.agregar({
          autor: 'asistente',
          texto: err.status === 429 ? 'Hiciste muchas preguntas seguidas. Espera un minuto e inténtalo de nuevo.' : 'No pude responder en este momento. Inténtalo más tarde.'
        });
      }
    });
  }

  private agregar(mensaje: Mensaje): void {
    this.mensajes.update(m => [...m, mensaje]);
    // Baja la conversación hasta el último mensaje cuando ya se dibujó
    setTimeout(() => {
      const h = this.historial()?.nativeElement;
      if (h) h.scrollTop = h.scrollHeight;
    });
  }
}
