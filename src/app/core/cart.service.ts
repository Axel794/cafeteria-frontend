import { Injectable, computed, signal } from '@angular/core';
import { Producto } from './models';

const CLAVE_CARRITO = 'cafeteria.carrito';
/** Mismo limite que el backend: maximo 20 unidades por producto. */
export const CANTIDAD_MAXIMA = 20;

export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  notas: string;
}

/**
 * Carrito de compras del cliente. Vive en el navegador (el backend no tiene carrito):
 * solo al confirmar se envia como un pedido. El total mostrado es una estimacion;
 * el valor oficial lo calcula siempre el servidor.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lineas = signal<LineaCarrito[]>(this.leer());

  readonly lineas = this._lineas.asReadonly();
  readonly cantidadTotal = computed(() => this._lineas().reduce((suma, l) => suma + l.cantidad, 0));
  readonly total = computed(() =>
    this._lineas().reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0),
  );
  readonly vacio = computed(() => this._lineas().length === 0);

  agregar(producto: Producto, cantidad = 1): void {
    this.actualizar((lineas) => {
      const existente = lineas.find((l) => l.producto.id === producto.id);
      if (existente) {
        return lineas.map((l) =>
          l === existente ? { ...l, cantidad: Math.min(l.cantidad + cantidad, CANTIDAD_MAXIMA) } : l,
        );
      }
      return [...lineas, { producto, cantidad: Math.min(cantidad, CANTIDAD_MAXIMA), notas: '' }];
    });
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    if (cantidad < 1) {
      this.quitar(productoId);
      return;
    }
    const permitida = Math.min(cantidad, CANTIDAD_MAXIMA);
    this.actualizar((lineas) =>
      lineas.map((l) => (l.producto.id === productoId ? { ...l, cantidad: permitida } : l)),
    );
  }

  cambiarNotas(productoId: number, notas: string): void {
    this.actualizar((lineas) =>
      lineas.map((l) => (l.producto.id === productoId ? { ...l, notas } : l)),
    );
  }

  quitar(productoId: number): void {
    this.actualizar((lineas) => lineas.filter((l) => l.producto.id !== productoId));
  }

  vaciar(): void {
    this.actualizar(() => []);
  }

  private actualizar(cambio: (lineas: LineaCarrito[]) => LineaCarrito[]): void {
    const nuevas = cambio(this._lineas());
    this._lineas.set(nuevas);
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(nuevas));
    } catch {
      // Sin almacenamiento: el carrito dura hasta recargar la pagina.
    }
  }

  private leer(): LineaCarrito[] {
    try {
      const texto = localStorage.getItem(CLAVE_CARRITO);
      return texto ? (JSON.parse(texto) as LineaCarrito[]) : [];
    } catch {
      return [];
    }
  }
}
