import { Component, input } from '@angular/core';
import { Documento } from '../../core/legal';

// Muestra un texto legal (términos o política de privacidad): su versión y sus secciones.
@Component({
  selector: 'app-documento-legal',
  template: `
    <p class="version">{{ documento().version }}</p>
    @for (s of documento().secciones; track s.titulo) {
    <h2>{{ s.titulo }}</h2>
    <p>{{ s.texto }}</p>
    }
  `,
  styles: `
    .version { margin: 0 0 12px; color: var(--tx-suave); font-size: 0.8125rem; }
    h2 { margin: 18px 0 4px; font-size: 1rem; font-weight: 700; color: var(--azul-tx); }
    p { margin: 0 0 6px; line-height: 1.6; }
  `
})
export class DocumentoLegal {
  documento = input.required<Documento>();
}
