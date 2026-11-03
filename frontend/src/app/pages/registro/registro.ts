import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NuevoUsuario } from '../../models/auth.model';
import { Logo } from '../../components/logo/logo';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, Logo],
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

  // Paso 1 = datos, paso 2 = código que llegó al correo
  paso = signal(1);
  codigo = '';
  mensajeCodigo = signal('');

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
      next: () => {
        this.cargando.set(false);
        this.paso.set(2);
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo conectar con el servidor');
      }
    });
  }

  // Paso 2: se envía el código; si es correcto, entra al sistema
  confirmarCodigo(): void {
    this.error.set('');
    this.mensajeCodigo.set('');
    this.cargando.set(true);

    this.auth.verificarCorreo(this.datos.correo.trim().toLowerCase(), this.codigo).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.cargando.set(false);
        this.error.set(err.error?.mensaje ?? 'No se pudo verificar el código');
      }
    });
  }

  reenviar(): void {
    this.error.set('');
    this.auth.reenviarCodigo(this.datos.correo.trim().toLowerCase()).subscribe({
      next: r => this.mensajeCodigo.set(r.mensaje),
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo reenviar el código')
    });
  }
}
