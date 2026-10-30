import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Interceptor: agrega el token a cada pedido y, si el backend responde 401, cierra la sesión.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const pedido = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(pedido).pipe(
    catchError(error => {
      // En el login un 401 solo significa "contraseña incorrecta": no se cierra nada
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
