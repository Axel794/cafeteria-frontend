import { APIRequestContext, Page, expect } from '@playwright/test';

export const API = process.env['API_URL'] ?? 'http://localhost:8080/api/v1';
export const ADMIN = { username: process.env['ADMIN_USER'] ?? 'admin', password: process.env['ADMIN_PASS'] ?? 'Admin123*' };
export const BARISTA = { username: process.env['BARISTA_USER'] ?? 'barista', password: process.env['BARISTA_PASS'] ?? 'Barista123*' };
export const EVIDENCIAS = 'e2e-evidencias';

export interface ProductoApi { id: number; nombre: string; precio: number; disponible: boolean; categoriaId: number; categoria: string }
export interface CategoriaApi { id: number; nombre: string }

/** Pide un token directamente a la API (no por la interfaz). */
export async function tokenDe(request: APIRequestContext, usuario: { username: string; password: string }): Promise<string> {
  const respuesta = await request.post(`${API}/auth/login`, { data: usuario });
  expect(respuesta.status(), 'login por API').toBe(200);
  return (await respuesta.json()).token as string;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Inicia sesion por la pantalla de login y espera a salir de ella. */
export async function entrar(page: Page, usuario: { username: string; password: string }): Promise<void> {
  await page.goto('/login');
  await page.fill('#username', usuario.username);
  await page.fill('#password', usuario.password);
  await page.click('button[type=submit]');
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

export async function captura(page: Page, nombre: string): Promise<void> {
  await page.screenshot({ path: `${EVIDENCIAS}/${nombre}.png`, fullPage: true });
}

/** Nombre unico para no chocar con datos existentes (el backend exige categorias unicas). */
export const unico = (prefijo: string): string => `${prefijo} ${Date.now().toString().slice(-8)}`;

/** Productos disponibles cuyo nombre no se repite (para localizarlos en la carta sin ambiguedad). */
export async function productosUnicosDisponibles(request: APIRequestContext, cuantos: number): Promise<ProductoApi[]> {
  const lista = (await (await request.get(`${API}/productos`)).json()) as ProductoApi[];
  const repetidos = new Set(lista.map((p) => p.nombre).filter((n, i, todos) => todos.indexOf(n) !== i));
  const elegidos = lista.filter((p) => p.disponible && !repetidos.has(p.nombre)).slice(0, cuantos);
  expect(elegidos.length, 'hay productos disponibles para probar').toBe(cuantos);
  return elegidos;
}
