import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivoService } from '../../services/activo.service';
import { BeneficiarioService } from '../../services/beneficiario.service';
import { Activo, Ahorro, DatosActivo, Entidad, MontoHistorico, TipoActivo } from '../../models/activo.model';
import { Beneficiario } from '../../models/beneficiario.model';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-activos',
  imports: [FormsModule, DecimalPipe, DatePipe, Modal],
  templateUrl: './activos.html',
  styleUrl: './activos.css'
})
export class Activos implements OnInit {
  activos = signal<Activo[]>([]);
  tipos = signal<TipoActivo[]>([]);
  entidades = signal<Entidad[]>([]);
  herederos = signal<Beneficiario[]>([]);
  error = signal('');
  mensaje = signal('');

  // Formulario de alta / edición: editandoId es null cuando se crea
  mostrarFormulario = signal(false);
  editandoId: number | null = null;
  form: DatosActivo = this.vacio();
  elegidosNuevo = signal<number[]>([]);

  // Método de ahorro y rango (opcionales). metodo vacío = sin método
  metodos = [
    { valor: 'LIBRE', nombre: 'Ahorro libre' },
    { valor: 'MENSUAL_FIJO', nombre: 'Aporte mensual fijo' },
    { valor: 'QUINCENAL_FIJO', nombre: 'Aporte quincenal fijo' },
    { valor: 'PORCENTAJE_SUELDO', nombre: 'Porcentaje del sueldo' },
    { valor: 'META', nombre: 'Meta de ahorro' }
  ];
  ahorro = { metodo: '', min: null as number | null, max: null as number | null };

  // Alta rápida de un banco desde el propio formulario
  nuevoBancoAbierto = signal(false);
  nuevoBanco = '';
  errorBanco = signal('');

  // Asignación de herederos a un activo
  asignando = signal<Activo | null>(null);
  elegidosAsignar = signal<number[]>([]);
  errorAsignar = signal('');

  // Historial de montos y confirmación de eliminación
  historialDe = signal<Activo | null>(null);
  historial = signal<MontoHistorico[]>([]);
  porEliminar = signal<Activo | null>(null);

  constructor(private activoService: ActivoService, private beneficiarioService: BeneficiarioService) {}

  ngOnInit(): void {
    this.cargar();
    this.activoService.getTipos().subscribe(data => this.tipos.set(data));
    this.activoService.getEntidades().subscribe(data => this.entidades.set(data));
    this.beneficiarioService.getBeneficiarios().subscribe(data => this.herederos.set(data));
  }

  cargar(): void {
    this.activoService.getActivos().subscribe(data => this.activos.set(data));
  }

  private vacio(): DatosActivo {
    return { nombre: '', descripcion: '', id_tipo: 0, id_entidad: null, registrar_monto: false, moneda: 'PEN', monto: null, ahorro: null };
  }

  // La sensibilidad y la necesidad de banco las define el tipo elegido
  tipoSeleccionado(): TipoActivo | undefined {
    return this.tipos().find(t => t.id === this.form.id_tipo);
  }

  // Al cambiar el tipo: los financieros activan el monto por defecto; los demás quitan el banco
  alCambiarTipo(): void {
    const tipo = this.tipoSeleccionado();
    if (!tipo) return;
    if (tipo.sensibilidad === 'FINANCIERA' && this.editandoId === null) this.form.registrar_monto = true;
    if (!tipo.requiereEntidad) this.form.id_entidad = null;
  }

  nombreMetodo(a: Ahorro): string {
    return this.metodos.find(m => m.valor === a.metodo)?.nombre ?? a.metodo;
  }

  simbolo(moneda: string | null): string {
    return moneda === 'USD' ? 'US$' : 'S/';
  }

  // Marca o desmarca un heredero dentro de una lista de ids
  alternar(lista: number[], id: number): number[] {
    return lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
  }

  nombresHerederos(a: Activo): string {
    return a.herederos.map(h => h.nombre).join(', ');
  }

  abrir(): void {
    this.editandoId = null;
    this.form = this.vacio();
    this.form.id_tipo = this.tipos()[0]?.id ?? 0;
    this.ahorro = { metodo: '', min: null, max: null };
    this.elegidosNuevo.set([]);
    this.cerrarBanco();
    this.error.set('');
    this.mostrarFormulario.set(true);
  }

  abrirEditar(a: Activo): void {
    this.editandoId = a.id;
    this.form = {
      nombre: a.nombre,
      descripcion: a.descripcion ?? '',
      id_tipo: a.idTipo,
      id_entidad: a.idEntidad,
      registrar_monto: a.registrarMonto,
      moneda: a.moneda === 'USD' ? 'USD' : 'PEN',
      monto: a.monto,
      ahorro: a.ahorro
    };
    this.ahorro = { metodo: a.ahorro?.metodo ?? '', min: a.ahorro?.min ?? null, max: a.ahorro?.max ?? null };
    this.cerrarBanco();
    this.error.set('');
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    this.error.set('');
    const datos: DatosActivo = {
      ...this.form,
      registrar_monto: this.form.registrar_monto,
      monto: this.form.registrar_monto ? this.form.monto : null,
      ahorro: this.form.registrar_monto && this.ahorro.metodo ? { ...this.ahorro } : null
    };

    const peticion: Observable<unknown> = this.editandoId === null
      ? this.activoService.crearActivo({ ...datos, beneficiarios: this.elegidosNuevo() })
      : this.activoService.actualizarActivo(this.editandoId, datos);

    peticion.subscribe({
      next: () => {
        this.mensaje.set(this.editandoId === null ? 'Activo creado' : 'Activo actualizado');
        this.cargar();
        this.mostrarFormulario.set(false);
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo guardar el activo')
    });
  }

  // --- Bancos ---
  abrirBanco(): void {
    this.nuevoBanco = '';
    this.errorBanco.set('');
    this.nuevoBancoAbierto.set(true);
  }

  cerrarBanco(): void {
    this.nuevoBancoAbierto.set(false);
    this.errorBanco.set('');
  }

  guardarBanco(): void {
    this.errorBanco.set('');
    this.activoService.crearEntidad(this.nuevoBanco).subscribe({
      next: banco => {
        this.entidades.update(lista => [...lista, banco].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.form.id_entidad = banco.id; // queda elegido el banco recién creado
        this.cerrarBanco();
      },
      error: err => this.errorBanco.set(err.error?.mensaje ?? 'No se pudo crear el banco')
    });
  }

  // --- Herederos ---
  abrirAsignar(a: Activo): void {
    this.elegidosAsignar.set(a.herederos.map(h => h.id));
    this.errorAsignar.set('');
    this.asignando.set(a);
  }

  guardarAsignacion(): void {
    const activo = this.asignando();
    if (!activo) return;

    this.activoService.asignarHerederos(activo.id, this.elegidosAsignar()).subscribe({
      next: () => {
        this.cargar();
        this.asignando.set(null);
      },
      error: err => this.errorAsignar.set(err.error?.mensaje ?? 'No se pudieron asignar los herederos')
    });
  }

  // --- Historial ---
  verHistorial(a: Activo): void {
    this.historial.set([]);
    this.historialDe.set(a);
    this.activoService.getHistorial(a.id).subscribe(data => this.historial.set(data));
  }

  // --- Eliminar ---
  confirmarEliminar(): void {
    const activo = this.porEliminar();
    if (!activo) return;

    this.activoService.eliminarActivo(activo.id).subscribe({
      next: () => {
        this.mensaje.set('Activo eliminado');
        this.error.set('');
        this.porEliminar.set(null);
        this.cargar();
      },
      error: err => {
        this.porEliminar.set(null);
        this.error.set(err.error?.mensaje ?? 'No se pudo eliminar el activo');
      }
    });
  }
}
