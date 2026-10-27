import { Routes } from '@angular/router';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Activos } from './pages/activos/activos';

export const routes: Routes = [
  { path: '', redirectTo: 'beneficiarios', pathMatch: 'full' },
  { path: 'beneficiarios', component: Beneficiarios },
  { path: 'activos', component: Activos }
];