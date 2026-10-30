import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BeneficiarioService } from '../../services/beneficiario.service';
import { Beneficiario, NuevoBeneficiario } from '../../models/beneficiario.model';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-beneficiarios',
  imports: [FormsModule, Modal],
  templateUrl: './beneficiarios.html',
  styleUrl: './beneficiarios.css'
})
export class Beneficiarios implements OnInit {
  beneficiarios = signal<Beneficiario[]>([]);
  mostrarFormulario = signal(false);
  error = signal('');
  avisoDni = signal('');
  buscandoDni = signal(false);

  parentescos = ['Hijo/a', 'Esposo/a', 'Padre', 'Madre', 'Hermano/a', 'Otro'];

  nuevo: NuevoBeneficiario = this.vacio();

  constructor(private beneficiarioService: BeneficiarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.beneficiarioService.getBeneficiarios().subscribe(data => {
      this.beneficiarios.set(data);
    });
  }

  abrir(): void {
    this.nuevo = this.vacio();
    this.error.set('');
    this.avisoDni.set('');
    this.mostrarFormulario.set(true);
  }

  // Busca los nombres por DNI y rellena el formulario. Si falla, se pueden escribir a mano.
  buscarDni(): void {
    this.avisoDni.set('');

    if (!/^\d{8}$/.test(this.nuevo.dni)) {
      this.avisoDni.set('Escribe un DNI de 8 dígitos');
      return;
    }

    this.buscandoDni.set(true);
    this.beneficiarioService.buscarDni(this.nuevo.dni).subscribe({
      next: persona => {
        this.nuevo.nombres = persona.nombres;
        this.nuevo.apellidos = persona.apellidos;
        this.buscandoDni.set(false);
        this.avisoDni.set('Datos encontrados. Verifícalos antes de guardar.');
      },
      error: err => {
        this.buscandoDni.set(false);
        this.avisoDni.set((err.error?.mensaje ?? 'No se pudo consultar el DNI') + '. Puedes escribir los datos a mano.');
      }
    });
  }

  guardar(): void {
    this.error.set('');
    this.beneficiarioService.crearBeneficiario(this.nuevo).subscribe({
      next: () => {
        this.cargar(); // vuelve a pedir la lista para que aparezca el nuevo
        this.mostrarFormulario.set(false);
      },
      // Si el backend rechaza los datos (por ejemplo, DNI inválido), se muestra su mensaje
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo registrar el beneficiario')
    });
  }

  private vacio(): NuevoBeneficiario {
    return { nombres: '', apellidos: '', dni: '', correo: '', parentesco: 'Hijo/a', claveAcceso: '' };
  }
}
