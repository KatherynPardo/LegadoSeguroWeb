import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PerfilService } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { ActualizarPerfil, CambiarPassword } from '../../models/perfil.model';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  dni = '';
  datos: ActualizarPerfil = { nombres: '', apellidos: '', correo: '', telefono: '' };
  clave: CambiarPassword = { actual: '', nueva: '' };
  confirmar = ''; // se compara con la nueva contraseña; no se envía al backend

  cargado = signal(false); // el formulario se muestra cuando ya llegaron los datos
  mensajePerfil = signal('');
  errorPerfil = signal('');
  mensajeClave = signal('');
  errorClave = signal('');

  constructor(private perfilService: PerfilService, private auth: AuthService) {}

  ngOnInit(): void {
    this.perfilService.getPerfil().subscribe(p => {
      this.dni = p.dni;
      this.datos = { nombres: p.nombres, apellidos: p.apellidos, correo: p.correo, telefono: p.telefono ?? '' };
      this.cargado.set(true);
    });
  }

  guardarPerfil(): void {
    this.mensajePerfil.set('');
    this.errorPerfil.set('');

    this.perfilService.actualizar(this.datos).subscribe({
      next: p => {
        // El menú lateral muestra el nombre nuevo sin tener que volver a iniciar sesión
        this.auth.actualizarUsuario({ id: p.id, nombres: p.nombres, apellidos: p.apellidos, correo: p.correo });
        this.mensajePerfil.set('Perfil actualizado correctamente');
      },
      error: err => this.errorPerfil.set(err.error?.mensaje ?? 'No se pudo actualizar el perfil')
    });
  }

  guardarClave(): void {
    this.mensajeClave.set('');
    this.errorClave.set('');

    // La confirmación evita guardar una contraseña con un error de tipeo
    if (this.clave.nueva !== this.confirmar) {
      this.errorClave.set('Las contraseñas no coinciden');
      return;
    }

    this.perfilService.cambiarPassword(this.clave).subscribe({
      next: () => {
        this.mensajeClave.set('Contraseña actualizada correctamente');
        this.clave = { actual: '', nueva: '' };
        this.confirmar = '';
      },
      error: err => this.errorClave.set(err.error?.mensaje ?? 'No se pudo cambiar la contraseña')
    });
  }
}
