import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivoService } from '../../services/activo.service';
import { Activo, NuevoActivo, TipoActivo } from '../../models/activo.model';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-activos',
  imports: [FormsModule, Modal],
  templateUrl: './activos.html',
  styleUrl: './activos.css'
})
export class Activos implements OnInit {
  activos = signal<Activo[]>([]);
  tipos = signal<TipoActivo[]>([]);
  mostrarFormulario = signal(false);
  error = signal('');

  nuevo: NuevoActivo = { nombre: '', descripcion: '', id_tipo: 0 };

  constructor(private activoService: ActivoService) {}

  ngOnInit(): void {
    this.cargar();
    this.activoService.getTipos().subscribe(data => this.tipos.set(data));
  }

  cargar(): void {
    this.activoService.getActivos().subscribe(data => {
      this.activos.set(data);
    });
  }

  // La sensibilidad la define el tipo elegido: se busca en la lista de tipos
  tipoSeleccionado(): TipoActivo | undefined {
    return this.tipos().find(t => t.id === this.nuevo.id_tipo);
  }

  abrir(): void {
    this.nuevo = { nombre: '', descripcion: '', id_tipo: this.tipos()[0]?.id ?? 0 };
    this.error.set('');
    this.mostrarFormulario.set(true);
  }

  guardar(): void {
    this.error.set('');
    this.activoService.crearActivo(this.nuevo).subscribe({
      next: () => {
        this.cargar(); // vuelve a pedir la lista para que aparezca el nuevo
        this.mostrarFormulario.set(false);
      },
      error: err => this.error.set(err.error?.mensaje ?? 'No se pudo crear el activo')
    });
  }
}
