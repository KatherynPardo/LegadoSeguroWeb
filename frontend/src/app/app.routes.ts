import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Activos } from './pages/activos/activos';
import { Perfil } from './pages/perfil/perfil';
import { Reglas } from './pages/reglas/reglas';
import { Procesos } from './pages/procesos/procesos';
import { Registro } from './pages/registro/registro';
import { Admin } from './pages/admin/admin';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  // Pantallas protegidas: exigen haber iniciado sesión
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'beneficiarios', component: Beneficiarios, canActivate: [authGuard] },
  { path: 'activos', component: Activos, canActivate: [authGuard] },
  { path: 'reglas', component: Reglas, canActivate: [authGuard] },
  { path: 'procesos', component: Procesos, canActivate: [authGuard] },
  { path: 'usuarios', component: Admin, canActivate: [authGuard, adminGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
