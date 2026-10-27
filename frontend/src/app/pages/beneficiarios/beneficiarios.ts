import { Component, OnInit, signal } from '@angular/core';
import { BeneficiarioService } from '../../services/beneficiario.service';
import { Beneficiario } from '../../models/beneficiario.model';

@Component({
  selector: 'app-beneficiarios',
  imports: [],
  templateUrl: './beneficiarios.html',
  styleUrl: './beneficiarios.css'
})
export class Beneficiarios implements OnInit {
  beneficiarios = signal<Beneficiario[]>([]);

  constructor(private beneficiarioService: BeneficiarioService) {}

  ngOnInit(): void {
    this.beneficiarioService.getBeneficiarios().subscribe(data => {
      this.beneficiarios.set(data);
    });
  }
}