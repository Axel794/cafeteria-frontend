import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, Rol } from './models';

const CLAVE_SESION = 'cafeteria.sesion';

interface Sesion {
  token: string;
  username: string;
  rol: Rol;
  /** Momento (en milisegundos) en que el token deja de valer. */
  expiraEn: number;
}

/**
 * Guarda quien inicio sesion. El token se conserva en localStorage para que
 * sobreviva a recargar la pagina; el backend lo valida en cada peticion.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _sesion = signal<Sesion | null>(this.leerSesion());

  /** Sesion vigente (null si no hay o ya expiro). Es una señal: la vista se actualiza sola. */
  readonly sesion = computed(() => this._sesion());
  readonly username = computed(() => this._sesion()?.username ?? null);
  readonly esAdministrador = computed(() => this._sesion()?.rol === 'ADMINISTRADOR');
  readonly esPersonal = computed(() => this._sesion() !== null);

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(tap((respuesta) => this.guardar(respuesta)));
  }

  cerrarSesion(): void {
    this._sesion.set(null);
    this.escribir(null);
  }

  /** Devuelve el token solo si sigue vigente; si expiro, cierra la sesion. */
  token(): string | null {
    const sesion = this._sesion();
    if (!sesion) {
      return null;
    }
    if (sesion.expiraEn <= Date.now()) {
      this.cerrarSesion();
      return null;
    }
    return sesion.token;
  }

  /** Rol del usuario con sesion vigente, o null. */
  rol(): Rol | null {
    return this.token() ? (this._sesion()?.rol ?? null) : null;
  }

  private guardar(respuesta: LoginResponse): void {
    const sesion: Sesion = {
      token: respuesta.token,
      username: respuesta.username,
      rol: respuesta.rol,
      expiraEn: Date.now() + respuesta.expiraEnMinutos * 60_000,
    };
    this._sesion.set(sesion);
    this.escribir(sesion);
  }

  private leerSesion(): Sesion | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      if (!texto) {
        return null;
      }
      const sesion = JSON.parse(texto) as Sesion;
      return sesion.expiraEn > Date.now() ? sesion : null;
    } catch {
      return null;
    }
  }

  private escribir(sesion: Sesion | null): void {
    try {
      if (sesion) {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      } else {
        localStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // Sin almacenamiento (modo privado): la sesion dura hasta recargar la pagina.
    }
  }
}
