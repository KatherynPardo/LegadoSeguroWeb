import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  correo = '';
  password = '';
  error = signal('');
  cargando = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Si ya hay sesión iniciada, no tiene sentido mostrar el login
    if (this.auth.logueado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ingresar(): void {
    this.error.set('');
    this.cargando.set(true);

    this.auth.login(this.correo, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.cargando.set(false);
        this.error.set(
          err.status === 401 || err.status === 400
            ? err.error?.mensaje
            : 'No se pudo conectar con el servidor'
        );
      }
    });
  }
}
