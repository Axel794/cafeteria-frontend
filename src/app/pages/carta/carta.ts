import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/cart.service';
import { CategoriaService } from '../../core/categoria.service';
import { mensajeDeError } from '../../core/errores';
import { Categoria, Producto } from '../../core/models';
import { ProductoService } from '../../core/producto.service';

/** Carta digital: muestra categorias y productos de la API y permite agregarlos al carrito. */
@Component({
  selector: 'app-carta',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './carta.html',
})
export class Carta {
  private readonly categoriaService = inject(CategoriaService);
  private readonly productoService = inject(ProductoService);
  protected readonly carrito = inject(CartService);

  protected readonly moneda = environment.moneda;
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly categoriaId = signal<number | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  /** Nombre del ultimo producto agregado, para mostrar una confirmacion breve. */
  protected readonly agregado = signal('');

  /** Productos de la categoria elegida (o todos). `computed` se recalcula solo cuando cambian sus señales. */
  protected readonly visibles = computed(() => {
    const id = this.categoriaId();
    return id === null ? this.productos() : this.productos().filter((p) => p.categoriaId === id);
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      categorias: this.categoriaService.listar(),
      productos: this.productoService.listar(),
    }).subscribe({
      next: ({ categorias, productos }) => {
        this.categorias.set(categorias);
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected elegirCategoria(id: number | null): void {
    this.categoriaId.set(id);
  }

  protected agregar(producto: Producto): void {
    this.carrito.agregar(producto);
    this.agregado.set(producto.nombre);
  }
}
