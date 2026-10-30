import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guardia: solo deja entrar a administradores; los demás vuelven al dashboard.
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.esAdmin() ? true : router.createUrlTree(['/dashboard']);
};
