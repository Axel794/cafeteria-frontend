import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { CategoriaService } from '../../core/categoria.service';
import { mensajeDeError } from '../../core/errores';
import { Categoria, Producto, ProductoRequest } from '../../core/models';
import { ProductoService } from '../../core/producto.service';
import { AdminNav } from '../../shared/admin-nav';

/** CRUD de productos con formulario reactivo y validaciones iguales a las del backend. */
@Component({
  selector: 'app-admin-productos',
  imports: [ReactiveFormsModule, DecimalPipe, AdminNav],
  templateUrl: './admin-productos.html',
})
export class AdminProductos {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly moneda = environment.moneda;
  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly guardando = signal(false);
  protected readonly editando = signal<number | null>(null);
  protected readonly confirmando = signal<number | null>(null);

  protected readonly form = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120), Validators.pattern(/.*\S.*/)]),
    descripcion: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    categoriaId: this.fb.control<number | null>(null, [Validators.required]),
    imagenUrl: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    alergenos: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    disponible: this.fb.nonNullable.control(true),
  });

  constructor() {
    this.cargar();
  }

  protected nuevo(): void {
    this.form.reset({ nombre: '', descripcion: '', precio: null, categoriaId: null, imagenUrl: '', alergenos: '', disponible: true });
    this.editando.set(0);
    this.limpiar();
  }

  protected editar(p: Producto): void {
    this.form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      categoriaId: p.categoriaId,
      imagenUrl: p.imagenUrl ?? '',
      alergenos: p.alergenos ?? '',
      disponible: p.disponible,
    });
    this.editando.set(p.id);
    this.limpiar();
  }

  protected cancelar(): void {
    this.editando.set(null);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: ProductoRequest = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      precio: Number(v.precio),
      categoriaId: Number(v.categoriaId),
      imagenUrl: v.imagenUrl.trim() || null,
      alergenos: v.alergenos.trim() || null,
      disponible: v.disponible,
    };
    const id = this.editando();
    this.guardando.set(true);
    this.error.set('');
    const peticion = id ? this.productoService.actualizar(id, datos) : this.productoService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.mensaje.set(id ? 'Producto actualizado.' : 'Producto creado.');
        this.editando.set(null);
        this.guardando.set(false);
        this.cargar();
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.guardando.set(false);
      },
    });
  }

  protected pedirEliminar(id: number): void {
    this.confirmando.set(id);
    this.limpiar();
  }

  protected eliminar(id: number): void {
    this.productoService.eliminar(id).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.mensaje.set('Producto eliminado.');
        this.cargar();
      },
      error: (e: unknown) => {
        this.confirmando.set(null);
        this.error.set(mensajeDeError(e));
      },
    });
  }

  private limpiar(): void {
    this.error.set('');
    this.mensaje.set('');
  }

  private cargar(): void {
    forkJoin({
      productos: this.productoService.listar(),
      categorias: this.categoriaService.listar(),
    }).subscribe({
      next: ({ productos, categorias }) => {
        this.productos.set(productos);
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }
}
