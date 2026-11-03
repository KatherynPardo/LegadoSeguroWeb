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

  // Los días de inactividad son libres entre estos valores (el backend valida lo mismo)
  minDias = 7;
  maxDias = 3650;

  // Atajos para elegir con un clic los plazos más comunes
  atajos = [15, 30, 90, 180, 365];
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

  // Convierte los días a una frase fácil de leer: "≈ 6 meses"
  equivalencia(): string {
    const dias = this.regla.diasInactividad;
    if (!Number.isInteger(dias) || dias < this.minDias) return '';
    if (dias < 60) return '';
    if (dias < 365) return `≈ ${Math.round(dias / 30)} meses`;
    const anios = Math.round((dias / 365) * 10) / 10;
    return `≈ ${anios} ${anios === 1 ? 'año' : 'años'}`;
  }

  diasValidos(): boolean {
    const dias = this.regla.diasInactividad;
    return Number.isInteger(dias) && dias >= this.minDias && dias <= this.maxDias;
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
