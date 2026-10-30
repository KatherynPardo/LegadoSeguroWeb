import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NuevoUsuario } from '../../models/auth.model';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: '../login/login.css'
})
export class Registro {
  datos: NuevoUsuario = { nombres: '', apellidos: '', dni: '', correo: '', telefono: '', password: '' };
  confirmar = '';
  error = signal('');
  cargando = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  crearCuenta(): void {
    this.error.set('');

    if (this.datos.password !== this.confirmar) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.cargando.set(true);
    this.auth.registrar(this.datos).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo conectar con el servidor');
      }
    });
  }
}
