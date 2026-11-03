import { Component, input } from '@angular/core';

// Escudo dorado de LegadoSeguro. El tamaño (en píxeles) se puede cambiar donde se use.
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="tamano()" viewBox="0 0 64 72" aria-hidden="true">
      <path d="M32 3 L59 13 V36 C59 53 47 65 32 69 C17 65 5 53 5 36 V13 Z" fill="none" stroke="#C9962C" stroke-width="5" stroke-linejoin="round" />
      <rect x="21" y="32" width="22" height="17" rx="3" fill="#C9962C" />
      <path d="M25 32 V27 A7 7 0 0 1 39 27 V32" fill="none" stroke="#C9962C" stroke-width="4" />
    </svg>
  `,
  styles: ':host { display: inline-flex; } svg { display: block; }'
})
export class Logo {
  tamano = input(40);
}
