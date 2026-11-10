import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

/**
 * Convierte cualquier error de una peticion HTTP en un texto legible para el usuario.
 * - status 0: el navegador no pudo llegar al backend (apagado, otra direccion o CORS).
 * - con cuerpo ApiError: se muestra el mensaje del backend y el detalle de cada campo invalido.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Comprueba que el backend esté encendido en el puerto 8080.';
  }
  const cuerpo = error.error as Partial<ApiError> | null;
  if (cuerpo && typeof cuerpo === 'object' && cuerpo.mensaje) {
    const detalles = cuerpo.detalles?.length ? ` (${cuerpo.detalles.join('; ')})` : '';
    return cuerpo.mensaje + detalles;
  }
  return `Error ${error.status}: ${error.statusText || 'la petición no se pudo completar'}`;
}
