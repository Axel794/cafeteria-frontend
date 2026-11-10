import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../core/models';
import { CategoriaService } from '../../core/categoria.service';
import { mensajeDeError } from '../../core/errores';
import { AdminNav } from '../../shared/admin-nav';

/**
 * CRUD de categorias. Limitacion del backend: GET /categorias solo devuelve las activas,
 * por eso el formulario no expone el campo "activa" (siempre se envia true).
 */
@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule, AdminNav],
  templateUrl: './admin-categorias.html',
})
export class AdminCategorias {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(CategoriaService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly guardando = signal(false);
  /** null = formulario cerrado; 0 = nueva; otro numero = id en edicion. */
  protected readonly editando = signal<number | null>(null);
  /** Id de la categoria a la espera de confirmar su eliminacion. */
  protected readonly confirmando = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80), Validators.pattern(/.*\S.*/)]],
  });

  constructor() {
    this.cargar();
  }

  protected nueva(): void {
    this.form.reset({ nombre: '' });
    this.editando.set(0);
    this.limpiar();
  }

  protected editar(c: Categoria): void {
    this.form.reset({ nombre: c.nombre });
    this.editando.set(c.id);
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
    const id = this.editando();
    const datos = { nombre: this.form.controls.nombre.value.trim(), activa: true };
    this.guardando.set(true);
    this.error.set('');
    const peticion = id ? this.servicio.actualizar(id, datos) : this.servicio.crear(datos);
    peticion.subscribe({
      next: () => {
        this.mensaje.set(id ? 'Categoría actualizada.' : 'Categoría creada.');
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
    this.servicio.eliminar(id).subscribe({
      next: () => {
        this.confirmando.set(null);
        this.mensaje.set('Categoría eliminada.');
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
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.categorias.set(lista);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }
}
