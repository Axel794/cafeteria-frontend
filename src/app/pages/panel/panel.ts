import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { mensajeDeError } from '../../core/errores';
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_TIPO,
  EstadoPedido,
  Pedido,
  siguienteEstado,
} from '../../core/models';
import { PedidoService } from '../../core/pedido.service';

const INTERVALO_MS = 15_000;

/** Panel de comandas para barista y administrador: ver pedidos y avanzar su estado. */
@Component({
  selector: 'app-panel',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './panel.html',
})
export class Panel {
  private readonly pedidoService = inject(PedidoService);

  protected readonly moneda = environment.moneda;
  protected readonly estados = ESTADOS;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiquetaTipo = ETIQUETA_TIPO;

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly filtro = signal<EstadoPedido | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');
  /** Ids de pedidos con un cambio de estado en curso (para deshabilitar su boton). */
  protected readonly ocupados = signal<ReadonlySet<number>>(new Set());

  constructor() {
    this.cargar(false);
    const temporizador = setInterval(() => this.cargar(true), INTERVALO_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(temporizador));
  }

  protected filtrar(estado: EstadoPedido | null): void {
    this.filtro.set(estado);
    this.cargar(false);
  }

  protected siguiente(pedido: Pedido): EstadoPedido | null {
    return siguienteEstado(pedido.estado);
  }

  protected avanzar(pedido: Pedido): void {
    const destino = siguienteEstado(pedido.estado);
    if (!destino) {
      return;
    }
    this.marcar(pedido.id, true);
    this.error.set('');
    this.pedidoService.cambiarEstado(pedido.id, destino).subscribe({
      next: () => {
        this.marcar(pedido.id, false);
        this.cargar(true);
      },
      error: (e: unknown) => {
        this.marcar(pedido.id, false);
        this.error.set(mensajeDeError(e));
        this.cargar(true);
      },
    });
  }

  protected recargar(): void {
    this.cargar(false);
  }

  private cargar(silencioso: boolean): void {
    if (!silencioso) {
      this.cargando.set(true);
    }
    this.pedidoService.listar(this.filtro() ?? undefined).subscribe({
      next: (lista) => {
        // Los mas antiguos primero: es el orden en que hay que prepararlos.
        this.pedidos.set([...lista].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)));
        this.cargando.set(false);
        if (!silencioso) {
          this.error.set('');
        }
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  private marcar(id: number, ocupado: boolean): void {
    const copia = new Set(this.ocupados());
    if (ocupado) {
      copia.add(id);
    } else {
      copia.delete(id);
    }
    this.ocupados.set(copia);
  }
}
