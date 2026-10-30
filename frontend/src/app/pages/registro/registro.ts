import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NuevoUsuario } from '../../models/auth.model';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['../login/login.css', './registro.css']
})
export class Registro {
  datos: NuevoUsuario = { nombres: '', apellidos: '', dni: '', correo: '', telefono: '', password: '' };
  confirmar = '';
  error = signal('');
  cargando = signal(false);
  buscandoDni = signal(false);
  aviso = signal('');
  verificado = signal(false); // true cuando los nombres vinieron de RENIEC

  constructor(private auth: AuthService, private router: Router) {}

  // Trae nombres y apellidos de RENIEC. Si el servicio no responde, se pueden escribir a mano.
  buscarDni(): void {
    this.aviso.set('');
    this.verificado.set(false);

    if (!/^\d{8}$/.test(this.datos.dni)) {
      this.aviso.set('Escribe un DNI de 8 dígitos');
      return;
    }

    this.buscandoDni.set(true);
    this.auth.buscarDni(this.datos.dni).subscribe({
      next: p => {
        this.datos.nombres = p.nombres;
        this.datos.apellidos = p.apellidos;
        this.verificado.set(true);
        this.buscandoDni.set(false);
        this.aviso.set('Datos verificados con RENIEC.');
      },
      error: err => {
        this.buscandoDni.set(false);
        this.aviso.set((err.error?.mensaje ?? 'No se pudo consultar el DNI') + '. Puedes escribir los datos a mano.');
      }
    });
  }

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
