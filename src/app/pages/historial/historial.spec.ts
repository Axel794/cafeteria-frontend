import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Pagina, PedidoResumen } from '../../core/models';
import { Historial } from './historial';

function fila(id: number): PedidoResumen {
  return {
    id, codigoTicket: 'CDD-' + String(id).padStart(6, '0'), fechaHora: '2026-11-20T10:00:00',
    estado: 'PENDIENTE', tipoPedido: 'LOCAL', numeroMesa: 1, nombreCliente: null, total: 12.5, cantidadLineas: 1,
  };
}

function pagina(numero: number, totalPaginas: number, total: number): Pagina<PedidoResumen> {
  return {
    contenido: [fila(1), fila(2)], pagina: numero, tamanio: 10, totalElementos: total,
    totalPaginas, primera: numero === 0, ultima: numero === totalPaginas - 1,
  };
}

describe('Historial (paginacion)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function crear() {
    const fixture = TestBed.createComponent(Historial);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { fixture, c: fixture.componentInstance as any };
  }

  it('al abrir pide la pagina 0 con tamanio 10', () => {
    crear();
    const req = http.expectOne((r) => r.url.endsWith('/pedidos/historial'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.has('estado')).toBe(false);
    req.flush(pagina(0, 3, 25));
    http.verify();
  });

  it('ir a la siguiente pagina pide page=1 y muestra el rango', () => {
    const { fixture, c } = crear();
    http.expectOne((r) => r.url.endsWith('/pedidos/historial')).flush(pagina(0, 3, 25));
    c.irA(1);
    const req = http.expectOne((r) => r.url.endsWith('/pedidos/historial'));
    expect(req.request.params.get('page')).toBe('1');
    req.flush(pagina(1, 3, 25));
    fixture.detectChanges();
    expect(c.rango()).toBe('Mostrando 11-12 de 25');
    http.verify();
  });

  it('no pide paginas fuera de rango ni la actual', () => {
    const { c } = crear();
    http.expectOne((r) => r.url.endsWith('/pedidos/historial')).flush(pagina(0, 3, 25));
    c.irA(-1);
    c.irA(3);
    c.irA(0);
    http.verify(); // ninguna peticion adicional
  });

  it('buscar con filtros vuelve a la pagina 0 y envia estado y texto', () => {
    const { c } = crear();
    http.expectOne((r) => r.url.endsWith('/pedidos/historial')).flush(pagina(2, 3, 25));
    c.estado = 'LISTO';
    c.texto = '  Ana ';
    c.buscar();
    const req = http.expectOne((r) => r.url.endsWith('/pedidos/historial'));
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('estado')).toBe('LISTO');
    expect(req.request.params.get('q')).toBe('Ana');
    req.flush(pagina(0, 1, 2));
  });

  it('la ventana del paginador muestra como maximo 5 numeros', () => {
    const { c } = crear();
    http.expectOne((r) => r.url.endsWith('/pedidos/historial')).flush(pagina(6, 20, 200));
    expect(c.paginas()).toEqual([4, 5, 6, 7, 8]);
  });
});
