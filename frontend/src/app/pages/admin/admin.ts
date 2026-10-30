import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { UsuarioAdmin } from '../../models/auth.model';

@Component({
  selector: 'app-admin',
  imports: [DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  usuarios = signal<UsuarioAdmin[]>([]);
  cargado = signal(false);
  error = signal('');

  constructor(private adminService: AdminService, private auth: AuthService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.adminService.getUsuarios().subscribe({
      next: lista => {
        this.usuarios.set(lista);
        this.cargado.set(true);
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo cargar la lista')
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
