import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guardia: si no hay sesión, manda a la pantalla de login.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.logueado() ? true : router.createUrlTree(['/login']);
};
