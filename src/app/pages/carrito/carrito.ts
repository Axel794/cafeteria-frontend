import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CANTIDAD_MAXIMA, CartService, LineaCarrito } from '../../core/cart.service';

/** Carrito: revisar cantidades, agregar notas por producto y continuar al pedido. */
@Component({
  selector: 'app-carrito',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './carrito.html',
})
export class Carrito {
  protected readonly carrito = inject(CartService);
  protected readonly moneda = environment.moneda;
  protected readonly maximo = CANTIDAD_MAXIMA;

  protected cambiarCantidad(linea: LineaCarrito, cambio: number): void {
    this.carrito.cambiarCantidad(linea.producto.id, linea.cantidad + cambio);
  }

  protected escribirNotas(linea: LineaCarrito, evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    this.carrito.cambiarNotas(linea.producto.id, campo.value);
  }
}
