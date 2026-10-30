import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(protected auth: AuthService) {}
}
