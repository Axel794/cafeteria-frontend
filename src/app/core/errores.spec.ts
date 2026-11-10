import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { mensajeDeError } from './errores';

describe('mensajeDeError', () => {
  it('avisa cuando no hay conexion con el servidor', () => {
    const e = new HttpErrorResponse({ status: 0 });
    expect(mensajeDeError(e)).toContain('No se pudo conectar');
  });

  it('usa el mensaje del backend', () => {
    const e = new HttpErrorResponse({
      status: 422,
      error: { timestamp: '', status: 422, error: 'Unprocessable', mensaje: 'Producto no disponible', detalles: [] },
    });
    expect(mensajeDeError(e)).toContain('Producto no disponible');
  });
});
