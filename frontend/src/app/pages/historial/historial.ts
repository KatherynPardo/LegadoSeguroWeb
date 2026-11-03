import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HistorialService } from '../../services/historial.service';
import { RegistroHistorial } from '../../models/historial.model';

@Component({
  selector: 'app-historial',
  imports: [DatePipe],
  templateUrl: './historial.html'
})
export class Historial implements OnInit {
  registros = signal<RegistroHistorial[]>([]);
  cargado = signal(false);

  // Nombres entendibles para las acciones que guarda el sistema
  nombres: Record<string, string> = {
    INICIO_SESION: 'Inicio de sesión',
    REGISTRO: 'Registro de cuenta',
    REGISTRAR_USUARIO: 'Cuenta creada',
    EDITAR_ACTIVO: 'Activo editado',
    ELIMINAR_ACTIVO: 'Activo eliminado',
    ASIGNAR_HEREDEROS: 'Herederos asignados',
    ELIMINAR_HEREDERO: 'Heredero eliminado',
    CANCELAR_PROCESO: 'Proceso cancelado',
    INICIAR_PROCESO: 'Proceso iniciado'
  };

  constructor(private historialService: HistorialService) {}

  ngOnInit(): void {
    this.historialService.getHistorial().subscribe(data => {
      this.registros.set(data);
      this.cargado.set(true);
    });
  }

  nombre(accion: string): string {
    return this.nombres[accion] ?? accion;
  }
}
