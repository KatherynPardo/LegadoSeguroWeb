import { Component, OnInit, signal } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Dashboard as ResumenDashboard } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  resumen = signal<ResumenDashboard | null>(null);

  constructor(private dashboardService: DashboardService, protected auth: AuthService) {}

  // "Hace 2 días", "Hace 3 horas"... a partir de una fecha
  hace(fecha: string): string {
    const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }

  ngOnInit(): void {
    this.dashboardService.getResumen().subscribe(data => {
      this.resumen.set(data);
    });
  }
}
