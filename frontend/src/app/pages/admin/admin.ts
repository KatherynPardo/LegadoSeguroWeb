import { Component, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { DocumentoService } from '../../services/documento.service';
import { ActivoService } from '../../services/activo.service';
import { TipoActivo } from '../../models/activo.model';
import { DatosRequisito, Requisito } from '../../models/documento.model';
import { Modal } from '../../components/modal/modal';
import { AuthService } from '../../services/auth.service';
import { RegistroAuditoria, UsuarioAdmin } from '../../models/auth.model';

@Component({
  selector: 'app-admin',
  imports: [DatePipe, FormsModule, Modal],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  usuarios = signal<UsuarioAdmin[]>([]);
  auditoria = signal<RegistroAuditoria[]>([]);
  cargado = signal(false);
  error = signal('');

  // Catálogo de documentos que se les pide a los herederos
  requisitos = signal<Requisito[]>([]);
  tiposActivo = signal<TipoActivo[]>([]);
  mostrarRequisito = signal(false);
  editandoRequisito: Requisito | null = null;
  formRequisito: DatosRequisito = { nombre: '', descripcion: '', obligatorio: false, tipos: [] };
  errorRequisito = signal('');

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private documentoService: DocumentoService,
    private activoService: ActivoService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRequisitos();
    this.activoService.getTipos().subscribe(data => this.tiposActivo.set(data));
  }

  cargar(): void {
    this.adminService.getUsuarios().subscribe({
      next: lista => {
        this.usuarios.set(lista);
        this.cargado.set(true);
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo cargar la lista')
    });

    this.adminService.getAuditoria().subscribe({
      next: lista => this.auditoria.set(lista),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo cargar la auditoría')
    });
  }

  // Marca o desmarca un tipo de activo en el formulario del requisito
  alternarTipo(id: number): void {
    const t = this.formRequisito.tipos;
    this.formRequisito.tipos = t.includes(id) ? t.filter(x => x !== id) : [...t, id];
  }

  // "Cuenta bancaria, Tarjeta de crédito" o "Todos los activos"
  nombresTipos(ids: number[]): string {
    if (ids.length === 0) return 'Todos los activos';
    return this.tiposActivo().filter(t => ids.includes(t.id)).map(t => t.nombre).join(', ');
  }

  cargarRequisitos(): void {
    this.documentoService.getRequisitos().subscribe(lista => this.requisitos.set(lista));
  }

  nuevoRequisito(): void {
    this.editandoRequisito = null;
    this.formRequisito = { nombre: '', descripcion: '', obligatorio: false, tipos: [] };
    this.errorRequisito.set('');
    this.mostrarRequisito.set(true);
  }

  editarRequisito(r: Requisito): void {
    this.editandoRequisito = r;
    this.formRequisito = { nombre: r.nombre, descripcion: r.descripcion ?? '', obligatorio: r.obligatorio, tipos: [...r.tipos] };
    this.errorRequisito.set('');
    this.mostrarRequisito.set(true);
  }

  guardarRequisito(): void {
    this.errorRequisito.set('');
    const actual = this.editandoRequisito;

    const peticion: Observable<unknown> = actual
      ? this.documentoService.editarRequisito(actual.id, this.formRequisito, actual.estado)
      : this.documentoService.crearRequisito(this.formRequisito);

    peticion.subscribe({
      next: () => {
        this.cargarRequisitos();
        this.mostrarRequisito.set(false);
      },
      error: err => this.errorRequisito.set(err.error?.mensaje ?? 'No se pudo guardar el requisito')
    });
  }

  // Activa o desactiva un requisito (uno inactivo deja de aparecer en los checklists)
  alternarRequisito(r: Requisito): void {
    const nuevo = r.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.documentoService.editarRequisito(r.id, { nombre: r.nombre, descripcion: r.descripcion ?? '', obligatorio: r.obligatorio, tipos: r.tipos }, nuevo)
      .subscribe({
        next: () => this.cargarRequisitos(),
        error: err => this.error.set(err.error?.mensaje ?? 'No se pudo actualizar el requisito')
      });
  }

  esPropio(u: UsuarioAdmin): boolean {
    return u.id === this.auth.usuario()?.id;
  }

  alternar(u: UsuarioAdmin): void {
    this.error.set('');
    const nuevo = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    this.adminService.cambiarEstado(u.id, nuevo).subscribe({
      next: () => this.cargar(),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo actualizar el usuario')
    });
  }
}
