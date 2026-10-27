import { Component, OnInit, signal } from '@angular/core';
import { ActivoService } from '../../services/activo.service';
import { Activo } from '../../models/activo.model';

@Component({
  selector: 'app-activos',
  imports: [],
  templateUrl: './activos.html',
  styleUrl: './activos.css'
})
export class Activos implements OnInit {
  activos = signal<Activo[]>([]);

  constructor(private activoService: ActivoService) {}

  ngOnInit(): void {
    this.activoService.getActivos().subscribe(data => {
      this.activos.set(data);
    });
  }
}