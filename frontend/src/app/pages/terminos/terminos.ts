import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocumentoLegal } from '../../components/documento-legal/documento-legal';
import { Idioma, TERMINOS } from '../../core/legal';

// Términos y condiciones en español e inglés
@Component({
  selector: 'app-terminos',
  imports: [RouterLink, DocumentoLegal],
  templateUrl: './terminos.html',
  styleUrl: '../privacidad/privacidad.css'
})
export class Terminos {
  terminos = TERMINOS;
  idioma = signal<Idioma>('es');
}
