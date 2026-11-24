import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth.guard';
import { Landing } from './pages/landing/landing';
import { Terminos } from './pages/terminos/terminos';
import { Privacidad } from './pages/privacidad/privacidad';
import { Reclamaciones } from './pages/reclamaciones/reclamaciones';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Activos } from './pages/activos/activos';
import { Perfil } from './pages/perfil/perfil';
import { Reglas } from './pages/reglas/reglas';
import { Procesos } from './pages/procesos/procesos';
import { Registro } from './pages/registro/registro';
import { Admin } from './pages/admin/admin';
import { Historial } from './pages/historial/historial';
import { Suscripcion } from './pages/suscripcion/suscripcion';
import { Reportes } from './pages/reportes/reportes';
import { Recuperar } from './pages/recuperar/recuperar';
import { Portal } from './pages/portal/portal';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', component: Landing, canActivate: [visitanteGuard], pathMatch: 'full' }, // página de inicio pública
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'recuperar', component: Recuperar },
  { path: 'portal', component: Portal }, // portal del heredero (tiene su propia sesión)
  // Páginas legales públicas
  { path: 'terminos', component: Terminos },
  { path: 'privacidad', component: Privacidad },
  { path: 'reclamaciones', component: Reclamaciones },
  // Pantallas protegidas: exigen haber iniciado sesión
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'beneficiarios', component: Beneficiarios, canActivate: [authGuard] },
  { path: 'activos', component: Activos, canActivate: [authGuard] },
  { path: 'reglas', component: Reglas, canActivate: [authGuard] },
  { path: 'procesos', component: Procesos, canActivate: [authGuard] },
  { path: 'suscripcion', component: Suscripcion, canActivate: [authGuard] },
  { path: 'reportes', component: Reportes, canActivate: [authGuard] },
  { path: 'usuarios', component: Admin, canActivate: [authGuard, adminGuard] },
  { path: 'historial', component: Historial, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
