import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { PortalService } from '../services/portal.service';

// Interceptor: agrega el token a cada pedido y, si el backend responde 401, cierra la sesión.
// Los pedidos al portal usan la sesión del heredero; todos los demás, la del propietario.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const portal = inject(PortalService);

  const esPortal = req.url.includes('/portal/');
  const token = esPortal ? portal.getToken() : auth.getToken();

  const pedido = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(pedido).pipe(
    catchError(error => {
      // En el login un 401 solo significa "contraseña incorrecta": no se cierra nada
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        if (esPortal) portal.salir();
        else auth.logout();
      }
      return throwError(() => error);
    })
  );
};
