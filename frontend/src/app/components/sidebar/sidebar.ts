import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  nombre = computed(() => {
    const u = this.auth.usuario();
    return u ? `${u.nombres} ${u.apellidos}` : '';
  });

  iniciales = computed(() => {
    const u = this.auth.usuario();
    return u ? (u.nombres[0] + u.apellidos[0]).toUpperCase() : '';
  });

  constructor(private auth: AuthService) {}

  salir(): void {
    this.auth.logout();
  }
}
