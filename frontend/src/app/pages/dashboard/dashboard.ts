import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Dashboard as ResumenDashboard } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  resumen = signal<ResumenDashboard | null>(null);

  // Va de 0 a 1 en un segundo: con él los números "suben" y el círculo se dibuja
  progreso = signal(0);

  // Largo de la circunferencia del círculo de salud (radio 54)
  circunferencia = 2 * Math.PI * 54;

  constructor(private dashboardService: DashboardService, protected auth: AuthService) {}

  ngOnInit(): void {
    this.dashboardService.getResumen().subscribe(data => {
      this.resumen.set(data);
      this.animar();
    });
  }

  // Animación de entrada: 1 segundo, empieza rápido y termina suave
  private animar(): void {
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / 1000);
      this.progreso.set(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  // Número que sube hasta su valor final
  contar(valor: number): number {
    return Math.round(valor * this.progreso());
  }

  // Cuánto del círculo está pintado
  desplazamiento(puntaje: number): number {
    return this.circunferencia * (1 - (puntaje / 100) * this.progreso());
  }

  titulo(puntaje: number): string {
    if (puntaje === 100) return 'Tu legado está completo';
    if (puntaje >= 60) return 'Vas muy bien';
    if (puntaje >= 20) return 'Buen comienzo';
    return 'Empecemos a proteger tu legado';
  }

  // Los pasos pendientes van primero
  pasosOrdenados(r: ResumenDashboard) {
    return [...r.salud.pasos].sort((a, b) => Number(a.hecho) - Number(b.hecho));
  }

  // Porcentaje de la barra "tu regla en acción"
  porcentajeInactividad(r: ResumenDashboard): number {
    const limite = r.inactividad.limiteDias;
    if (!limite) return 0;
    return Math.min(100, ((r.inactividad.diasDesdeIngresoAnterior ?? 0) / limite) * 100);
  }

  // Color de la barra: verde, naranja o rojo según qué tan cerca esté del límite
  nivelInactividad(r: ResumenDashboard): string {
    const p = this.porcentajeInactividad(r);
    return p >= 80 ? 'rojo' : p >= 50 ? 'naranja' : 'verde';
  }

  diasRestantes(r: ResumenDashboard): number {
    return (r.inactividad.limiteDias ?? 0) - (r.inactividad.diasDesdeIngresoAnterior ?? 0);
  }

  // Color del puntito de cada actividad
  colorActividad(tipo: string): string {
    if (tipo === 'INICIO_SESION') return 'azul';
    if (tipo.startsWith('ELIMINAR') || tipo === 'CANCELAR_PROCESO') return 'rojo';
    if (tipo === 'INICIAR_PROCESO') return 'naranja';
    return 'verde';
  }

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
}
