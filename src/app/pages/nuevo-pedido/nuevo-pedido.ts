import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/cart.service';
import { mensajeDeError } from '../../core/errores';
import { Pedido, PedidoRequest, TipoPedido } from '../../core/models';
import { PedidoService } from '../../core/pedido.service';

/** Digitos, espacios, + y guion; entre 7 y 20 caracteres (el backend permite hasta 20). */
const TELEFONO = /^[0-9+\s-]{7,20}$/;

/**
 * Confirmacion del pedido con un formulario reactivo.
 * Las validaciones cambian segun la modalidad (igual que las reglas del backend):
 *  - LOCAL  -> el numero de mesa es obligatorio
 *  - PICKUP -> nombre y telefono son obligatorios
 */
@Component({
  selector: 'app-nuevo-pedido',
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './nuevo-pedido.html',
})
export class NuevoPedido {
  private readonly fb = inject(FormBuilder);
  private readonly pedidoService = inject(PedidoService);
  protected readonly carrito = inject(CartService);
  protected readonly moneda = environment.moneda;

  protected readonly form = this.fb.group({
    tipoPedido: this.fb.nonNullable.control<TipoPedido>('LOCAL'),
    numeroMesa: this.fb.control<number | null>(null),
    nombreCliente: this.fb.nonNullable.control(''),
    telefonoCliente: this.fb.nonNullable.control(''),
  });

  /** Modalidad elegida como señal, para mostrar u ocultar campos en la vista. */
  protected readonly tipo = toSignal(this.form.controls.tipoPedido.valueChanges, {
    initialValue: 'LOCAL' as TipoPedido,
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  /** Pedido ya confirmado por el backend (con su ticket). */
  protected readonly confirmado = signal<Pedido | null>(null);

  constructor() {
    this.aplicarReglas('LOCAL');
    this.form.controls.tipoPedido.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((tipo) => this.aplicarReglas(tipo));
  }

  /** Campo con error visible solo despues de que el usuario lo toco o intento enviar. */
  protected invalido(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const pedido: PedidoRequest = {
      tipoPedido: valores.tipoPedido,
      numeroMesa: valores.tipoPedido === 'LOCAL' ? valores.numeroMesa : null,
      nombreCliente: valores.tipoPedido === 'PICKUP' ? valores.nombreCliente.trim() : null,
      telefonoCliente: valores.tipoPedido === 'PICKUP' ? valores.telefonoCliente.trim() : null,
      detalles: this.carrito.lineas().map((linea) => ({
        productoId: linea.producto.id,
        cantidad: linea.cantidad,
        notas: linea.notas.trim() || null,
      })),
    };

    this.enviando.set(true);
    this.error.set('');
    this.pedidoService.crear(pedido).subscribe({
      next: (creado) => {
        this.confirmado.set(creado);
        this.carrito.vaciar();
        this.enviando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }

  private aplicarReglas(tipo: TipoPedido): void {
    const { numeroMesa, nombreCliente, telefonoCliente } = this.form.controls;
    if (tipo === 'LOCAL') {
      numeroMesa.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
      nombreCliente.setValidators([]);
      telefonoCliente.setValidators([]);
    } else {
      numeroMesa.setValidators([]);
      nombreCliente.setValidators([Validators.required, Validators.maxLength(100)]);
      telefonoCliente.setValidators([Validators.required, Validators.pattern(TELEFONO)]);
    }
    numeroMesa.updateValueAndValidity();
    nombreCliente.updateValueAndValidity();
    telefonoCliente.updateValueAndValidity();
  }
}
