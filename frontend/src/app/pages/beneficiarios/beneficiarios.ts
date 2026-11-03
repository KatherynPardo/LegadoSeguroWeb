import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
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
  editandoId: number | null = null; // null cuando se crea uno nuevo
  error = signal('');
  mensaje = signal('');
  avisoDni = signal('');
  buscandoDni = signal(false);
  porEliminar = signal<Beneficiario | null>(null);

  // Código de verificación que recibe el heredero en su correo
  correoOriginal = ''; // al editar, solo se pide código si el correo cambia o aún no está verificado
  verificadoOriginal = false;
  enviandoCodigo = signal(false);
  avisoCodigo = signal('');

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

  // Iniciales para el círculo de la tarjeta (primer nombre + primer apellido)
  iniciales(b: Beneficiario): string {
    return (b.nombres.trim()[0] + b.apellidos.trim()[0]).toUpperCase();
  }

  abrir(): void {
    this.editandoId = null;
    this.correoOriginal = '';
    this.verificadoOriginal = false;
    this.nuevo = this.vacio();
    this.error.set('');
    this.avisoDni.set('');
    this.avisoCodigo.set('');
    this.mostrarFormulario.set(true);
  }

  abrirEditar(b: Beneficiario): void {
    this.editandoId = b.id;
    this.nuevo = {
      nombres: b.nombres,
      apellidos: b.apellidos,
      dni: b.dni,
      correo: b.correo ?? '',
      telefono: b.telefono ?? '',
      parentesco: b.parentesco ?? 'Otro',
      codigo: ''
    };
    this.correoOriginal = b.correo ?? '';
    this.verificadoOriginal = b.verificado;
    this.error.set('');
    this.avisoDni.set('');
    this.avisoCodigo.set('');
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

  // Hay que pedir código al crear un heredero, o al editar si cambió el correo
  necesitaCodigo(): boolean {
    return this.editandoId === null || !this.verificadoOriginal
      || this.nuevo.correo.trim().toLowerCase() !== this.correoOriginal.toLowerCase();
  }

  enviarCodigo(): void {
    this.avisoCodigo.set('');
    this.error.set('');

    this.enviandoCodigo.set(true);
    this.beneficiarioService.pedirCodigo(this.nuevo.correo).subscribe({
      next: r => {
        this.enviandoCodigo.set(false);
        this.avisoCodigo.set(r.mensaje + '. Pídele el código de 6 dígitos y escríbelo aquí.');
      },
      error: err => {
        this.enviandoCodigo.set(false);
        this.avisoCodigo.set(err.error?.mensaje ?? 'No se pudo enviar el código');
      }
    });
  }

  guardar(): void {
    this.error.set('');
    const editando = this.editandoId !== null;

    const peticion: Observable<unknown> = editando
      ? this.beneficiarioService.actualizarBeneficiario(this.editandoId!, this.nuevo)
      : this.beneficiarioService.crearBeneficiario(this.nuevo);

    peticion.subscribe({
      next: () => {
        this.mensaje.set(editando ? 'Heredero actualizado' : 'Heredero registrado');
        this.cargar(); // vuelve a pedir la lista para que aparezcan los cambios
        this.mostrarFormulario.set(false);
      },
      // Si el backend rechaza los datos (por ejemplo, DNI repetido), se muestra su mensaje
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo guardar el heredero')
    });
  }

  confirmarEliminar(): void {
    const heredero = this.porEliminar();
    if (!heredero) return;

    this.beneficiarioService.eliminarBeneficiario(heredero.id).subscribe({
      next: () => {
        this.mensaje.set('Heredero eliminado');
        this.error.set('');
        this.porEliminar.set(null);
        this.cargar();
      },
      error: err => {
        this.porEliminar.set(null);
        this.error.set(err.error?.mensaje ?? 'No se pudo eliminar el heredero');
      }
    });
  }

  private vacio(): NuevoBeneficiario {
    return { nombres: '', apellidos: '', dni: '', correo: '', telefono: '', parentesco: 'Hijo/a', codigo: '' };
  }
}
