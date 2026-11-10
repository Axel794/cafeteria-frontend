import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeDeError } from '../../core/errores';
import { ESTADOS, ETIQUETA_ESTADO, ETIQUETA_TIPO, Tracker } from '../../core/models';
import { PedidoService } from '../../core/pedido.service';

/** Segundos entre consultas automaticas mientras el pedido no este entregado. */
const INTERVALO_MS = 10_000;

/**
 * Seguimiento publico del pedido. El ticket tiene la forma CDD-000012, donde el numero
 * es el id del pedido; la API consulta por id, asi que aqui se extrae ese numero.
 */
@Component({
  selector: 'app-seguimiento',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './seguimiento.html',
})
export class Seguimiento {
  /** Llega desde la ruta /seguimiento/:id gracias a withComponentInputBinding(). */
  readonly id = input<string>();

  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);

  protected readonly campo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\s*(CDD-)?\d{1,9}\s*$/i)],
  });

  protected readonly tracker = signal<Tracker | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected readonly pasos = ESTADOS;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiquetaTipo = ETIQUETA_TIPO;
  protected readonly indiceActual = computed(() => {
    const actual = this.tracker();
    return actual ? ESTADOS.indexOf(actual.estado) : -1;
  });

  private temporizador: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Cada vez que cambia el :id de la ruta, se consulta ese pedido.
    effect(() => {
      const valor = this.id();
      this.detener();
      if (valor) {
        this.campo.setValue(valor, { emitEvent: false });
        this.consultar(Number(valor), false);
      } else {
        this.tracker.set(null);
        this.error.set('');
      }
    });
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  protected buscar(): void {
    if (this.campo.invalid) {
      this.campo.markAsTouched();
      return;
    }
    const numero = this.extraerId(this.campo.value);
    if (String(numero) === this.id()) {
      this.detener();
      this.consultar(numero, false);
    } else {
      void this.router.navigate(['/seguimiento', numero]);
    }
  }

  protected get mostrarError(): boolean {
    return this.campo.invalid && this.campo.touched;
  }

  private extraerId(texto: string): number {
    return Number(texto.trim().toUpperCase().replace('CDD-', ''));
  }

  private consultar(id: number, silencioso: boolean): void {
    if (!silencioso) {
      this.cargando.set(true);
      this.error.set('');
    }
    this.pedidoService.tracker(id).subscribe({
      next: (respuesta) => {
        this.tracker.set(respuesta);
        // El campo muestra el ticket (CDD-000007), aunque la ruta use el id (7).
        if (!silencioso) {
          this.campo.setValue(respuesta.codigoTicket, { emitEvent: false });
        }
        this.error.set('');
        this.cargando.set(false);
        if (respuesta.estado !== 'ENTREGADO' && this.temporizador === undefined) {
          this.temporizador = setInterval(() => this.consultar(id, true), INTERVALO_MS);
        }
      },
      error: (e: unknown) => {
        this.detener();
        if (!silencioso) {
          this.tracker.set(null);
        }
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  private detener(): void {
    if (this.temporizador !== undefined) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }
}
