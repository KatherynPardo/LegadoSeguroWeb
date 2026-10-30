import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Dashboard as ResumenDashboard } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  resumen = signal<ResumenDashboard | null>(null);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getResumen().subscribe(data => {
      this.resumen.set(data);
    });
  }
}
