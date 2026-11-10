import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parametros de la ruta (/seguimiento/:id) llegan como inputs del componente.
    provideRouter(routes, withComponentInputBinding()),
    // El interceptor agrega el token JWT a cada peticion y maneja el 401.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
