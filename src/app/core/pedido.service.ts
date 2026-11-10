import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadoPedido, Pedido, PedidoRequest, Tracker } from './models';

/**
 * Acceso a /api/v1/pedidos.
 *  - Publico: crear un pedido y consultar su seguimiento (tracker).
 *  - Barista o administrador: listar, ver el detalle y cambiar el estado.
 */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pedidos`;

  crear(datos: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.url, datos);
  }

  tracker(id: number): Observable<Tracker> {
    return this.http.get<Tracker>(`${this.url}/${id}/tracker`);
  }

  listar(estado?: EstadoPedido): Observable<Pedido[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Pedido[]>(this.url, { params });
  }

  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.url}/${id}/estado`, { estado });
  }
}
