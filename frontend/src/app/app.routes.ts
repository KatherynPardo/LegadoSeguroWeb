import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Activos } from './pages/activos/activos';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'beneficiarios', component: Beneficiarios },
  { path: 'activos', component: Activos }
];
