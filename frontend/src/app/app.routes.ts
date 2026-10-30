import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Activos } from './pages/activos/activos';
import { Perfil } from './pages/perfil/perfil';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  // Pantallas protegidas: exigen haber iniciado sesión
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'beneficiarios', component: Beneficiarios, canActivate: [authGuard] },
  { path: 'activos', component: Activos, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
