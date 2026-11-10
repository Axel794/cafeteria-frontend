import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Se ejecuta en TODAS las peticiones HTTP:
 * 1. Si hay sesion vigente, agrega la cabecera  Authorization: Bearer <token>.
 * 2. Si el backend responde 401 con una sesion abierta (token vencido o invalido),
 *    cierra la sesion y lleva al usuario al login.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = peticion.url.startsWith(environment.apiUrl) ? auth.token() : null;
  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !peticion.url.endsWith('/auth/login')) {
        auth.cerrarSesion();
        void router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => error);
    }),
  );
};
