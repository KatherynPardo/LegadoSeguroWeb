import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Logo } from '../../components/logo/logo';

@Component({
  selector: 'app-recuperar',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './recuperar.html',
  styleUrl: '../login/login.css'
})
export class Recuperar {
  // Paso 1 = pedir el código con el correo, paso 2 = escribir el código y la contraseña nueva
  paso = signal(1);
  correo = '';
  codigo = '';
  password = '';
  confirmar = '';
  error = signal('');
  aviso = signal('');
  cargando = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  pedirCodigo(): void {
    this.error.set('');
    this.cargando.set(true);

    this.auth.olvidePassword(this.correo.trim().toLowerCase()).subscribe({
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

  cambiar(): void {
    this.error.set('');

    if (this.password !== this.confirmar) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.cargando.set(true);
    this.auth.restablecerPassword(this.correo.trim().toLowerCase(), this.codigo, this.password).subscribe({
      next: () => {
        // Contraseña cambiada: vuelve al login para entrar con la nueva
        this.router.navigate(['/login']);
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo cambiar la contraseña');
      }
    });
  }
}
