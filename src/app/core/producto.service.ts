import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto, ProductoRequest } from './models';

/** Acceso a /api/v1/productos. GET es publico; crear, editar y eliminar exigen rol ADMINISTRADOR. */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  listar(categoriaId?: number, soloDisponibles?: boolean): Observable<Producto[]> {
    let params = new HttpParams();
    if (categoriaId !== undefined) {
      params = params.set('categoriaId', categoriaId);
    }
    if (soloDisponibles !== undefined) {
      params = params.set('soloDisponibles', soloDisponibles);
    }
    return this.http.get<Producto[]>(this.url, { params });
  }

  crear(datos: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.url, datos);
  }

  actualizar(id: number, datos: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
