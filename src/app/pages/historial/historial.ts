import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { mensajeDeError } from '../../core/errores';
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_TIPO,
  EstadoPedido,
  Pagina,
  PedidoResumen,
} from '../../core/models';
import { PedidoService } from '../../core/pedido.service';

/** Cantidad maxima de botones numerados que se muestran a la vez en el paginador. */
const VENTANA = 5;

/** Historial de pedidos para el personal: listado paginado en el servidor, con filtros. */
@Component({
  selector: 'app-historial',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './historial.html',
})
export class Historial {
  private readonly pedidoService = inject(PedidoService);

  protected readonly moneda = environment.moneda;
  protected readonly estados = ESTADOS;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiquetaTipo = ETIQUETA_TIPO;
  protected readonly tamanios = [5, 10, 20, 50];

  // Filtros (se aplican al pulsar "Buscar"; no se consulta en cada tecla).
  protected estado: EstadoPedido | '' = '';
  protected desde = '';
  protected hasta = '';
  protected texto = '';

  protected readonly tamanio = signal(10);
  protected readonly resultado = signal<Pagina<PedidoResumen> | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal('');

  /** Numeros de pagina (empiezan en 1 para el usuario) de la ventana visible del paginador. */
  protected readonly paginas = computed<number[]>(() => {
    const r = this.resultado();
    if (!r || r.totalPaginas <= 1) {
      return [];
    }
    let inicio = Math.max(0, r.pagina - Math.floor(VENTANA / 2));
    const fin = Math.min(r.totalPaginas, inicio + VENTANA);
    inicio = Math.max(0, fin - VENTANA);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  });

  /** "Mostrando 11-20 de 57". */
  protected readonly rango = computed(() => {
    const r = this.resultado();
    if (!r || r.totalElementos === 0) {
      return '';
    }
    const primero = r.pagina * r.tamanio + 1;
    const ultimo = r.pagina * r.tamanio + r.contenido.length;
    return `Mostrando ${primero}-${ultimo} de ${r.totalElementos}`;
  });

  constructor() {
    this.cargar(0);
  }

  protected buscar(): void {
    this.cargar(0);
  }

  protected limpiar(): void {
    this.estado = '';
    this.desde = '';
    this.hasta = '';
    this.texto = '';
    this.cargar(0);
  }

  protected irA(pagina: number): void {
    const r = this.resultado();
    if (!r || pagina < 0 || pagina >= r.totalPaginas || pagina === r.pagina) {
      return;
    }
    this.cargar(pagina);
  }

  protected cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));
    this.cargar(0);
  }

  private cargar(pagina: number): void {
    this.cargando.set(true);
    this.error.set('');
    this.pedidoService
      .historial({
        estado: this.estado || null,
        desde: this.desde || null,
        hasta: this.hasta || null,
        q: this.texto,
        pagina,
        tamanio: this.tamanio(),
      })
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.error.set(mensajeDeError(e));
          this.cargando.set(false);
        },
      });
  }
}
