import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivoService } from '../../services/activo.service';
import { Activo, NuevoActivo } from '../../models/activo.model';

@Component({
  selector: 'app-activos',
  imports: [FormsModule],
  templateUrl: './activos.html',
  styleUrl: './activos.css'
})
export class Activos implements OnInit {
  activos = signal<Activo[]>([]);
  mostrarFormulario = signal(false);

  // Tipos de activo (provisional: después vendrán del backend)
  tipos = [
    { id: 1, nombre: 'Red social' },
    { id: 2, nombre: 'Correo electrónico' },
    { id: 3, nombre: 'Cuenta bancaria' },
    { id: 4, nombre: 'Billetera de cripto' }
  ];

  nuevo: NuevoActivo = { nombre: '', descripcion: '', id_tipo: 1 };

  constructor(private activoService: ActivoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.activoService.getActivos().subscribe(data => {
      this.activos.set(data);
    });
  }

  guardar(): void {
    this.activoService.crearActivo(this.nuevo).subscribe(() => {
      this.cargar(); // vuelve a pedir la lista para que aparezca el nuevo
      this.mostrarFormulario.set(false);
      this.nuevo = { nombre: '', descripcion: '', id_tipo: 1 };
    });
  }
}
