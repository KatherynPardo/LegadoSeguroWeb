import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocumentoLegal } from '../../components/documento-legal/documento-legal';
import { PRIVACIDAD } from '../../core/legal';

// Política de privacidad (Ley N.° 29733)
@Component({
  selector: 'app-privacidad',
  imports: [RouterLink, DocumentoLegal],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.css'
})
export class Privacidad {
  privacidad = PRIVACIDAD;
}
