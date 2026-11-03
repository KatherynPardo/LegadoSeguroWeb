import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivoService } from '../../services/activo.service';
import { BeneficiarioService } from '../../services/beneficiario.service';
import { Activo, DatosActivo, Entidad, MontoHistorico, TipoActivo } from '../../models/activo.model';
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
  guardando = signal(false); // evita que un doble clic envíe el formulario dos veces

  // Formulario de alta / edición: editandoId es null cuando se crea
  mostrarFormulario = signal(false);
  editandoId: number | null = null;
  form: DatosActivo = this.vacio();
  elegidosNuevo = signal<number[]>([]);

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
    return { nombre: '', descripcion: '', id_tipo: 0, id_entidad: null, registrar_monto: false, moneda: 'PEN', monto: null, indicaciones: '', tarjeta: null };
  }

  // La sensibilidad y la necesidad de banco las define el tipo elegido
  tipoSeleccionado(): TipoActivo | undefined {
    return this.tipos().find(t => t.id === this.form.id_tipo);
  }

  // Al cambiar el tipo: los financieros activan el monto por defecto; los demás quitan el banco
  alCambiarTipo(): void {
    const tipo = this.tipoSeleccionado();
    if (!tipo) return;
    if (tipo.sensibilidad === 'FINANCIERA' && !tipo.esTarjeta && this.editandoId === null) this.form.registrar_monto = true;
    if (tipo.esTarjeta && this.editandoId === null) this.form.registrar_monto = false; // en las tarjetas, el usuario decide si registra la línea
    if (!tipo.requiereEntidad) this.form.id_entidad = null;

    // Las tarjetas llevan sus propios datos (solo los 4 últimos dígitos)
    if (tipo.esTarjeta && !this.form.tarjeta) this.form.tarjeta = { ultimos4: '', diaPago: null, diaCierre: null };
    if (!tipo.esTarjeta) this.form.tarjeta = null;
  }

  // Texto de ayuda: qué conviene indicarle al heredero en este tipo de activo
  guia(): string {
    return this.tipoSeleccionado()?.guiaIndicaciones ?? 'Escribe lo que tu heredero debe saber sobre este activo.';
  }

  // Lo que se muestra de una tarjeta: nunca el número completo
  mascara(a: Activo): string {
    return a.tarjeta ? `•••• •••• •••• ${a.tarjeta.ultimos4}` : '';
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
      indicaciones: a.indicaciones ?? '',
      tarjeta: a.tarjeta ? { ...a.tarjeta } : null
    };
    this.cerrarBanco();
    this.error.set('');
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');
    // El monto es opcional: si marcó registrarlo pero no escribió nada, simplemente no se registra
    const hayMonto = this.form.registrar_monto && this.form.monto !== null && String(this.form.monto) !== '';
    const datos: DatosActivo = {
      ...this.form,
      registrar_monto: hayMonto,
      monto: hayMonto ? this.form.monto : null,
      tarjeta: this.tipoSeleccionado()?.esTarjeta ? this.form.tarjeta : null
    };

    const peticion: Observable<unknown> = this.editandoId === null
      ? this.activoService.crearActivo({ ...datos, beneficiarios: this.elegidosNuevo() })
      : this.activoService.actualizarActivo(this.editandoId, datos);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensaje.set(this.editandoId === null ? 'Activo creado' : 'Activo actualizado');
        this.cargar();
        this.mostrarFormulario.set(false);
      },
      error: err => {
        this.guardando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo guardar el activo');
      }
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
