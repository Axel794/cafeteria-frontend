import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartService } from '../../core/cart.service';
import { NuevoPedido } from './nuevo-pedido';

describe('NuevoPedido (validaciones del formulario)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(CartService).agregar({
      id: 1, nombre: 'Espresso', descripcion: null, precio: 8, disponible: true,
      categoriaId: 1, categoria: 'Cafes', imagenUrl: null, alergenos: null,
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(NuevoPedido);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fixture.componentInstance as any;
  }

  it('LOCAL exige numero de mesa', () => {
    const c = crear();
    expect(c.form.invalid).toBe(true);
    c.form.controls.numeroMesa.setValue(5);
    expect(c.form.valid).toBe(true);
  });

  it('PICKUP exige nombre y un telefono valido', () => {
    const c = crear();
    c.form.controls.tipoPedido.setValue('PICKUP');
    expect(c.form.invalid).toBe(true);
    c.form.controls.nombreCliente.setValue('Ana');
    c.form.controls.telefonoCliente.setValue('abc');
    expect(c.form.invalid).toBe(true);
    c.form.controls.telefonoCliente.setValue('987654321');
    expect(c.form.valid).toBe(true);
  });
});
