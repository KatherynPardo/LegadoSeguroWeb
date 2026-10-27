import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Menú de navegación superior: se reutiliza en todas las pantallas desde app.html
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class Navbar {}
