import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { BeneficiarioService } from '../../services/beneficiario.service';
import { SuscripcionService } from '../../services/suscripcion.service';
import { DocumentoService } from '../../services/documento.service';
import { DocumentoDeHeredero } from '../../models/documento.model';
import { Beneficiario, NuevoBeneficiario } from '../../models/beneficiario.model';
import { ActivoService } from '../../services/activo.service';
import { Activo } from '../../models/activo.model';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-beneficiarios',
  imports: [FormsModule, Modal],
  templateUrl: './beneficiarios.html',
  styleUrl: './beneficiarios.css'
})
export class Beneficiarios implements OnInit {
  beneficiarios = signal<Beneficiario[]>([]);
  misActivos = signal<Activo[]>([]); // para elegir qué activos recibirá el heredero
  mostrarFormulario = signal(false);
  editandoId: number | null = null; // null cuando se crea uno nuevo
  error = signal('');
  mensaje = signal('');
  avisoDni = signal('');
  buscandoDni = signal(false);
  porEliminar = signal<Beneficiario | null>(null);

  // Checklist de documentos del heredero elegido
  documentosDe = signal<Beneficiario | null>(null);
  documentos = signal<DocumentoDeHeredero[]>([]);
  errorDocumentos = signal('');

  // Límite de herederos del plan (null = sin límite) y aviso para mejorar el plan
  limite = signal<number | null>(null);
  avisoPlan = signal(false);

  // Código de verificación que recibe el heredero en su correo
  correoOriginal = ''; // al editar, solo se pide código si el correo cambia o aún no está verificado
  verificadoOriginal = false;
  enviandoCodigo = signal(false);
  avisoCodigo = signal('');
  errorCodigo = signal('');

  // El botón de enviar el código solo se activa con un correo completo (usuario@dominio.com)
  correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevo.correo.trim());
  }

  parentescos = ['Hijo/a', 'Esposo/a', 'Padre', 'Madre', 'Hermano/a', 'Otro'];

  nuevo: NuevoBeneficiario = this.vacio();

  constructor(
    private beneficiarioService: BeneficiarioService,
    private suscripcionService: SuscripcionService,
    private documentoService: DocumentoService,
    private activoService: ActivoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.activoService.getActivos().subscribe(data => this.misActivos.set(data));
    this.suscripcionService.getSuscripcion().subscribe(s => this.limite.set(s.limiteHerederos));
  }

  // true si el plan tiene límite y ya se usó completo
  limiteAlcanzado(): boolean {
    const limite = this.limite();
    return limite !== null && this.beneficiarios().length >= limite;
  }

  // Porcentaje de la barra de uso (máximo 100)
  porcentajeUso(): number {
    const limite = this.limite();
    if (limite === null || limite === 0) return 0;
    return Math.min(100, Math.round((this.beneficiarios().length / limite) * 100));
  }

  irAPlanes(): void {
    this.avisoPlan.set(false);
    this.router.navigate(['/suscripcion']);
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
    // Si ya usó todos los herederos de su plan, en vez del formulario se le ofrece mejorar el plan
    if (this.limiteAlcanzado()) {
      this.avisoPlan.set(true);
      return;
    }

    this.editandoId = null;
    this.correoOriginal = '';
    this.verificadoOriginal = false;
    this.nuevo = this.vacio();
    this.error.set('');
    this.avisoDni.set('');
    this.avisoCodigo.set('');
    this.errorCodigo.set('');
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
      codigo: '',
      activos: b.activos.map(a => a.id)
    };
    this.correoOriginal = b.correo ?? '';
    this.verificadoOriginal = b.verificado;
    this.error.set('');
    this.avisoDni.set('');
    this.avisoCodigo.set('');
    this.errorCodigo.set('');
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

  // Marca o desmarca un activo que recibirá el heredero
  alternarActivo(id: number): void {
    const a = this.nuevo.activos;
    this.nuevo.activos = a.includes(id) ? a.filter(x => x !== id) : [...a, id];
  }

  // Hay que pedir código al crear un heredero, o al editar si cambió el correo
  necesitaCodigo(): boolean {
    return this.editandoId === null || !this.verificadoOriginal
      || this.nuevo.correo.trim().toLowerCase() !== this.correoOriginal.toLowerCase();
  }

  enviarCodigo(): void {
    this.avisoCodigo.set('');
    this.errorCodigo.set('');
    this.error.set('');

    this.enviandoCodigo.set(true);
    this.beneficiarioService.pedirCodigo(this.nuevo.correo).subscribe({
      next: r => {
        this.enviandoCodigo.set(false);
        this.avisoCodigo.set(r.mensaje + '. Pídele el código de 6 dígitos y escríbelo aquí.');
      },
      error: err => {
        this.enviandoCodigo.set(false);
        if (err.error?.codigo === 'LIMITE_PLAN') {
          this.mostrarFormulario.set(false);
          this.avisoPlan.set(true);
          return;
        }
        this.errorCodigo.set(err.error?.mensaje ?? 'No se pudo enviar el código');
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
      error: err => {
        if (err.error?.codigo === 'LIMITE_PLAN') {
          this.mostrarFormulario.set(false);
          this.avisoPlan.set(true);
          return;
        }
        this.error.set(err.error?.mensaje ?? 'No se pudo guardar el heredero');
      }
    });
  }

  // ---- Documentos que debe reunir el heredero ----
  abrirDocumentos(b: Beneficiario): void {
    this.errorDocumentos.set('');
    this.documentos.set([]);
    this.documentosDe.set(b);
    this.documentoService.getDocumentos(b.id).subscribe(lista => this.documentos.set(lista));
  }

  cambiarUbicacion(d: DocumentoDeHeredero, valor: string): void {
    this.documentos.update(lista => lista.map(x => x.id === d.id ? { ...x, ubicacion: valor } : x));
  }

  guardarDocumentos(): void {
    const heredero = this.documentosDe();
    if (!heredero) return;

    // Los documentos que le tocan al heredero salen de sus activos; aquí solo se anota dónde está cada original
    const elegidos = this.documentos().map(d => ({ idRequisito: d.id, ubicacion: d.ubicacion?.trim() || null }));

    this.documentoService.guardarDocumentos(heredero.id, elegidos).subscribe({
      next: () => {
        this.mensaje.set('Documentos del heredero actualizados');
        this.documentosDe.set(null);
      },
      error: err => this.errorDocumentos.set(err.error?.mensaje ?? 'No se pudieron guardar los documentos')
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
    return { nombres: '', apellidos: '', dni: '', correo: '', telefono: '', parentesco: 'Hijo/a', codigo: '', activos: [] };
  }
}
