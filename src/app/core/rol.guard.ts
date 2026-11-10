import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';

/**
 * Protege una ruta: solo entra quien tenga sesion y uno de los roles indicados.
 *   - sin sesion        -> /login (y recuerda a donde queria ir)
 *   - rol insuficiente  -> /sin-permiso
 * Ojo: esto solo mejora la experiencia; la seguridad real la aplica el backend con el token.
 */
export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  (_ruta, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.rol();

    if (!rol) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: estado.url } });
    }
    return roles.includes(rol) ? true : router.createUrlTree(['/sin-permiso']);
  };
