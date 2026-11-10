import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('guarda la sesion al iniciar sesion y la borra al salir', () => {
    auth.login({ username: 'admin', password: 'x' }).subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({
      token: 'abc', tipo: 'Bearer', username: 'admin', rol: 'ADMINISTRADOR', expiraEnMinutos: 120,
    });
    expect(auth.token()).toBe('abc');
    expect(auth.esAdministrador()).toBe(true);
    auth.cerrarSesion();
    expect(auth.token()).toBeNull();
    expect(auth.rol()).toBeNull();
  });
});
