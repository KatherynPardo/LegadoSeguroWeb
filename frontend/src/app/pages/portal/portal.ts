import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../../services/portal.service';
import { ChecklistHeredero, DocumentoChecklist } from '../../models/documento.model';
import { Logo } from '../../components/logo/logo';

@Component({
  selector: 'app-portal',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './portal.html',
  styleUrl: './portal.css'
})
export class Portal implements OnInit {
  // Ingreso: paso 1 = correo, paso 2 = código
  paso = signal(1);
  correo = '';
  codigo = '';
  aviso = signal('');
  error = signal('');
  cargando = signal(false);

  // Checklist (cuando ya ingresó)
  listas = signal<ChecklistHeredero[]>([]);
  cargado = signal(false);

  constructor(protected portal: PortalService) {}

  ngOnInit(): void {
    if (this.portal.ingresado()) this.cargarChecklist();
  }

  // ---- Ingreso ----
  pedirCodigo(): void {
    this.error.set('');
    this.cargando.set(true);

    this.portal.pedirCodigo(this.correo.trim().toLowerCase()).subscribe({
      next: r => {
        this.cargando.set(false);
        this.aviso.set(r.mensaje);
        this.paso.set(2);
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo conectar con el servidor');
      }
    });
  }

  entrar(): void {
    this.error.set('');
    this.cargando.set(true);

    this.portal.entrar(this.correo.trim().toLowerCase(), this.codigo).subscribe({
      next: () => {
        this.cargando.set(false);
        this.cargarChecklist();
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo ingresar');
      }
    });
  }

  // ---- Checklist ----
  cargarChecklist(): void {
    this.portal.getChecklist().subscribe(data => {
      this.listas.set(data);
      this.cargado.set(true);
    });
  }

  entregados(lista: ChecklistHeredero): number {
    return lista.documentos.filter(d => d.estado === 'ENTREGADO').length;
  }

  porcentaje(lista: ChecklistHeredero): number {
    return lista.documentos.length === 0 ? 0 : Math.round((this.entregados(lista) / lista.documentos.length) * 100);
  }

  alternar(doc: DocumentoChecklist): void {
    const nuevo = doc.estado !== 'ENTREGADO';
    this.portal.marcar(doc.id, nuevo).subscribe({
      next: () => this.cargarChecklist(),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo guardar')
    });
  }
}
