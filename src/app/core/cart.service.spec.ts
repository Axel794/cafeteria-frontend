import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CANTIDAD_MAXIMA, CartService } from './cart.service';
import { Producto } from './models';

const espresso: Producto = {
  id: 1, nombre: 'Espresso', descripcion: null, precio: 8, disponible: true,
  categoriaId: 1, categoria: 'Cafes', imagenUrl: null, alergenos: null,
};

describe('CartService', () => {
  let carrito: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    carrito = TestBed.inject(CartService);
  });

  it('agrega productos y calcula cantidad y total', () => {
    carrito.agregar(espresso);
    carrito.agregar(espresso);
    expect(carrito.cantidadTotal()).toBe(2);
    expect(carrito.total()).toBe(16);
  });

  it('no supera el maximo de 20 unidades por producto', () => {
    for (let i = 0; i < 25; i++) {
      carrito.agregar(espresso);
    }
    expect(carrito.cantidadTotal()).toBe(CANTIDAD_MAXIMA);
  });

  it('quita y vacia', () => {
    carrito.agregar(espresso);
    carrito.quitar(1);
    expect(carrito.vacio()).toBe(true);
  });
});
