import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReglaService } from '../../services/regla.service';
import { DatosRegla } from '../../models/regla.model';

@Component({
  selector: 'app-reglas',
  imports: [FormsModule],
  templateUrl: './reglas.html',
  styleUrl: './reglas.css'
})
export class Reglas implements OnInit {
  cargado = signal(false); // el formulario se muestra cuando ya llegaron los datos
  mensaje = signal('');
  error = signal('');

  totalBeneficiarios = 0;

  // Opciones que ofrece la pantalla (el backend valida las mismas)
  opcionesInactividad = [
    { dias: 90, texto: '90 días (3 meses)' },
    { dias: 180, texto: '180 días (6 meses)' },
    { dias: 270, texto: '270 días (9 meses)' },
    { dias: 365, texto: '365 días (1 año)' }
  ];
  opcionesEspera = [7, 15, 30, 60];

  // Valores por defecto: se usan mientras el usuario no haya guardado una regla
  regla: DatosRegla = { diasInactividad: 180, minConfirmaciones: 1, diasPeriodoEspera: 15, requiereValidador: false };

  constructor(private reglaService: ReglaService) {}

  ngOnInit(): void {
    this.reglaService.getRegla().subscribe(r => {
      this.totalBeneficiarios = r.totalBeneficiarios;

      if (r.regla) {
        const { id, ...datos } = r.regla;
        this.regla = datos;
      }
      // Las confirmaciones mínimas no pueden superar los beneficiarios designados
      this.regla.minConfirmaciones = Math.min(this.regla.minConfirmaciones, Math.max(this.totalBeneficiarios, 1));
      this.cargado.set(true);
    });
  }

  // Lista 1..N para el selector "k de N beneficiarios"
  opcionesConfirmaciones(): number[] {
    return Array.from({ length: Math.max(this.totalBeneficiarios, 1) }, (_, i) => i + 1);
  }

  guardar(): void {
    this.mensaje.set('');
    this.error.set('');

    this.reglaService.guardar(this.regla).subscribe({
      next: () => this.mensaje.set('Regla guardada correctamente'),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo guardar la regla')
    });
  }
}
