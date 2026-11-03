import { Component, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { DocumentoService } from '../../services/documento.service';
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
  mostrarRequisito = signal(false);
  editandoRequisito: Requisito | null = null;
  formRequisito: DatosRequisito = { nombre: '', descripcion: '', obligatorio: false };
  errorRequisito = signal('');

  constructor(
    private adminService: AdminService,
    private auth: AuthService,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRequisitos();
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

  cargarRequisitos(): void {
    this.documentoService.getRequisitos().subscribe(lista => this.requisitos.set(lista));
  }

  nuevoRequisito(): void {
    this.editandoRequisito = null;
    this.formRequisito = { nombre: '', descripcion: '', obligatorio: false };
    this.errorRequisito.set('');
    this.mostrarRequisito.set(true);
  }

  editarRequisito(r: Requisito): void {
    this.editandoRequisito = r;
    this.formRequisito = { nombre: r.nombre, descripcion: r.descripcion ?? '', obligatorio: r.obligatorio };
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
    this.documentoService.editarRequisito(r.id, { nombre: r.nombre, descripcion: r.descripcion ?? '', obligatorio: r.obligatorio }, nuevo)
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
