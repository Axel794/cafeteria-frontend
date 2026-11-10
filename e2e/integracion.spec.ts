import { APIRequestContext, Page, expect, test } from '@playwright/test';
import {
  ADMIN, API, BARISTA, CategoriaApi, ProductoApi, auth, captura, entrar, productosUnicosDisponibles, tokenDe, unico,
} from './helpers';

/**
 * Pruebas de integracion: cada una parte de la interaccion en Angular y comprueba, con una
 * consulta directa a la API, que el dato quedo guardado (o se borro) en el backend.
 */
test.describe.configure({ mode: 'serial' });

let request: APIRequestContext;
let tokenAdmin: string;
let tokenBarista: string;
const creados = { productos: [] as string[], categorias: [] as string[] };

test.beforeAll(async ({ playwright }) => {
  request = await playwright.request.newContext();
  tokenAdmin = await tokenDe(request, ADMIN);
  tokenBarista = await tokenDe(request, BARISTA);
});

test.afterAll(async () => {
  // Limpieza: si alguna prueba fallo a medias, borra lo que dejo creado.
  const productos = (await (await request.get(`${API}/productos`)).json()) as ProductoApi[];
  for (const p of productos.filter((x) => creados.productos.includes(x.nombre))) {
    await request.delete(`${API}/productos/${p.id}`, { headers: auth(tokenAdmin) });
  }
  const categorias = (await (await request.get(`${API}/categorias`)).json()) as CategoriaApi[];
  for (const c of categorias.filter((x) => creados.categorias.includes(x.nombre))) {
    await request.delete(`${API}/categorias/${c.id}`, { headers: auth(tokenAdmin) });
  }
  await request.dispose();
});

const listarProductos = async () => (await (await request.get(`${API}/productos`)).json()) as ProductoApi[];
const listarCategorias = async () => (await (await request.get(`${API}/categorias`)).json()) as CategoriaApi[];

async function agregarAlCarrito(page: Page, nombre: string): Promise<void> {
  const tarjeta = page.locator('.producto-card').filter({ has: page.getByRole('heading', { name: nombre, exact: true }) });
  await tarjeta.getByRole('button', { name: 'Agregar al pedido' }).click();
}

test.describe('Consulta (GET)', () => {
  test('IT-01 La carta muestra los mismos productos que devuelve la API', async ({ page }) => {
    const desdeApi = await listarProductos();
    await page.goto('/carta');
    await expect(page.locator('.producto-card')).toHaveCount(desdeApi.length);
    await expect(page.getByRole('heading', { name: desdeApi[0].nombre, exact: true }).first()).toBeVisible();
    await captura(page, 'IT-01-carta');
  });

  test('IT-02 El filtro por categoria coincide con GET /productos?categoriaId=', async ({ page }) => {
    const categorias = await listarCategorias();
    let elegida: CategoriaApi | undefined;
    let esperados = 0;
    for (const c of categorias) {
      const n = ((await (await request.get(`${API}/productos?categoriaId=${c.id}`)).json()) as ProductoApi[]).length;
      if (n > 0) { elegida = c; esperados = n; break; }
    }
    expect(elegida, 'alguna categoria con productos').toBeDefined();
    await page.goto('/carta');
    await page.getByRole('button', { name: elegida!.nombre, exact: true }).click();
    await expect(page.locator('.producto-card')).toHaveCount(esperados);
    await captura(page, 'IT-02-filtro-categoria');
  });
});

test.describe('Autenticacion y autorizacion', () => {
  test('IT-03 Login con credenciales incorrectas muestra el error del backend y no entra', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', BARISTA.username);
    await page.fill('#password', 'clave-incorrecta');
    await page.click('button[type=submit]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('cafeteria.sesion'))).toBeNull();
    await captura(page, 'IT-03-login-incorrecto');
  });

  test('IT-04 Login correcto guarda la sesion y lleva a la pantalla de su rol', async ({ page }) => {
    await entrar(page, BARISTA);
    await expect(page).toHaveURL(/\/panel/);
    await expect(page.getByText(`Hola, ${BARISTA.username}`)).toBeVisible();
    await captura(page, 'IT-04-login-barista');
  });

  test('IT-05 El barista no entra a administracion (guard) y la API tambien le responde 403', async ({ page }) => {
    await entrar(page, BARISTA);
    await page.goto('/admin/productos');
    await expect(page.getByRole('heading', { name: 'No tienes permiso' })).toBeVisible();
    await captura(page, 'IT-05-sin-permiso');

    const sinToken = await request.post(`${API}/productos`, { data: { nombre: 'x', precio: 1, categoriaId: 1 } });
    expect(sinToken.status(), 'POST /productos sin token').toBe(401);
    const comoBarista = await request.post(`${API}/productos`, {
      headers: auth(tokenBarista), data: { nombre: 'x', precio: 1, categoriaId: 1 },
    });
    expect(comoBarista.status(), 'POST /productos como BARISTA').toBe(403);
  });

  test('IT-06 Un token invalido hace que el interceptor cierre la sesion y pida login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() =>
      localStorage.setItem('cafeteria.sesion', JSON.stringify({ token: 'token.falso.123', username: 'barista', rol: 'BARISTA', expiraEn: Date.now() + 3_600_000 })),
    );
    await page.goto('/panel');
    await expect(page).toHaveURL(/\/login\?expirada=1/);
    await expect(page.getByText('Tu sesión expiró')).toBeVisible();
    await captura(page, 'IT-06-sesion-expirada');
  });
});

test.describe('CRUD de administracion (POST, PUT, DELETE) con persistencia', () => {
  test('IT-07 Productos: crear, editar y eliminar desde Angular queda reflejado en la API', async ({ page }) => {
    const nombre = unico('E2E Producto');
    creados.productos.push(nombre);
    await entrar(page, ADMIN);
    await page.goto('/admin/productos');
    await page.getByRole('button', { name: 'Nuevo producto' }).click();

    await page.fill('#p-nombre', nombre);
    await page.fill('#p-precio', '11.5');
    await page.selectOption('#p-cat', { index: 1 });
    await page.fill('#p-desc', 'Creado por la prueba de integracion');
    await page.click('form button[type=submit]');
    await expect(page.getByText('Producto creado.')).toBeVisible();
    await captura(page, 'IT-07a-producto-creado');

    let guardado = (await listarProductos()).find((p) => p.nombre === nombre);
    expect(guardado, 'el producto existe en la API').toBeDefined();
    expect(Number(guardado!.precio)).toBe(11.5);

    await page.locator('tr', { hasText: nombre }).getByRole('button', { name: 'Editar' }).click();
    await page.fill('#p-precio', '13.75');
    await page.click('form button[type=submit]');
    await expect(page.getByText('Producto actualizado.')).toBeVisible();
    guardado = (await listarProductos()).find((p) => p.nombre === nombre);
    expect(Number(guardado!.precio), 'precio actualizado en la API').toBe(13.75);
    await captura(page, 'IT-07b-producto-editado');

    await page.locator('tr', { hasText: nombre }).getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page.getByText('Producto eliminado.')).toBeVisible();
    expect((await listarProductos()).some((p) => p.nombre === nombre), 'ya no existe en la API').toBe(false);
    await captura(page, 'IT-07c-producto-eliminado');
  });

  test('IT-08 Categorias: crear, editar y eliminar desde Angular queda reflejado en la API', async ({ page }) => {
    const nombre = unico('E2E Cat');
    const editado = `${nombre} v2`;
    creados.categorias.push(nombre, editado);
    await entrar(page, ADMIN);
    await page.goto('/admin/categorias');
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    await page.fill('#nombre-cat', nombre);
    await page.click('form button[type=submit]');
    await expect(page.getByText('Categoría creada.')).toBeVisible();
    expect((await listarCategorias()).some((c) => c.nombre === nombre), 'existe en la API').toBe(true);
    await captura(page, 'IT-08a-categoria-creada');

    await page.locator('tr', { hasText: nombre }).getByRole('button', { name: 'Editar' }).click();
    await page.fill('#nombre-cat', editado);
    await page.click('form button[type=submit]');
    await expect(page.getByText('Categoría actualizada.')).toBeVisible();
    expect((await listarCategorias()).some((c) => c.nombre === editado), 'nombre nuevo en la API').toBe(true);
    await captura(page, 'IT-08b-categoria-editada');

    await page.locator('tr', { hasText: editado }).getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page.getByText('Categoría eliminada.')).toBeVisible();
    expect((await listarCategorias()).some((c) => c.nombre === editado), 'ya no existe').toBe(false);
  });

  test('IT-09 El backend rechaza borrar una categoria con productos (409) y el mensaje llega a la pantalla', async ({ page }) => {
    const categorias = await listarCategorias();
    let conProductos: CategoriaApi | undefined;
    for (const c of categorias) {
      if (((await (await request.get(`${API}/productos?categoriaId=${c.id}`)).json()) as ProductoApi[]).length > 0) { conProductos = c; break; }
    }
    expect(conProductos, 'una categoria con productos').toBeDefined();
    await entrar(page, ADMIN);
    await page.goto('/admin/categorias');
    await page.locator('tr', { hasText: conProductos!.nombre }).first().getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page.locator('.alert-danger')).toContainText(/productos/i);
    expect((await listarCategorias()).some((c) => c.id === conProductos!.id), 'la categoria sigue existiendo').toBe(true);
    await captura(page, 'IT-09-categoria-409');
  });
});

test.describe('Validaciones del cliente', () => {
  test('IT-10 Los formularios invalidos muestran errores y no envian nada al backend', async ({ page }) => {
    const envios: string[] = [];
    page.on('request', (r) => { if (['POST', 'PUT'].includes(r.method()) && r.url().includes('/api/v1/') && !r.url().includes('/auth/')) envios.push(`${r.method()} ${r.url()}`); });

    await entrar(page, ADMIN);
    await page.goto('/admin/productos');
    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    await page.click('form button[type=submit]');
    await expect(page.locator('.invalid-feedback:visible')).toHaveCount(3);
    await captura(page, 'IT-10a-producto-invalido');

    await page.goto('/admin/categorias');
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    await page.click('form button[type=submit]');
    await expect(page.locator('.invalid-feedback:visible')).toHaveCount(1);

    expect(envios, 'ninguna peticion de escritura salio').toEqual([]);
  });

  test('IT-11 Pedido: LOCAL exige mesa y PICKUP exige nombre y telefono valido', async ({ page }) => {
    const [p] = await productosUnicosDisponibles(request, 1);
    await page.goto('/carta');
    await agregarAlCarrito(page, p.nombre);
    await page.goto('/pedido');

    await page.click('button[type=submit]');
    await expect(page.getByText('Indica el número de tu mesa.')).toBeVisible();
    await captura(page, 'IT-11a-pedido-local-sin-mesa');

    await page.check('#tipo-pickup');
    await page.click('button[type=submit]');
    await expect(page.getByText('El nombre es obligatorio para pedidos para llevar.')).toBeVisible();
    await page.fill('#nombre', 'Prueba E2E');
    await page.fill('#telefono', 'abc');
    await expect(page.getByText(/teléfono válido/)).toBeVisible();
    await captura(page, 'IT-11b-pedido-pickup-invalido');
  });
});

test.describe('Flujo principal: del clic en Angular a la base de datos', () => {
  test('IT-12 Pedido LOCAL: cliente confirma, el barista lo atiende y el cliente ve el nuevo estado', async ({ page, browser }) => {
    const [a, b] = await productosUnicosDisponibles(request, 2);
    await page.goto('/carta');
    await agregarAlCarrito(page, a.nombre);
    await agregarAlCarrito(page, b.nombre);
    await agregarAlCarrito(page, b.nombre);
    await page.goto('/carrito');
    await captura(page, 'IT-12a-carrito');
    await page.getByRole('link', { name: 'Continuar con el pedido' }).click();
    await page.fill('#mesa', '7');
    await page.click('button[type=submit]');

    const ticket = (await page.locator('[data-testid=ticket]').innerText()).trim();
    expect(ticket).toMatch(/^CDD-\d{6}$/);
    await captura(page, 'IT-12b-pedido-confirmado');
    const id = Number(ticket.replace('CDD-', ''));

    // Persistencia: el pedido existe en el backend con los datos enviados.
    const respuesta = await request.get(`${API}/pedidos/${id}`, { headers: auth(tokenBarista) });
    expect(respuesta.status()).toBe(200);
    const guardado = await respuesta.json();
    expect(guardado.estado).toBe('PENDIENTE');
    expect(guardado.tipoPedido).toBe('LOCAL');
    expect(guardado.numeroMesa).toBe(7);
    expect(guardado.detalles).toHaveLength(2);
    expect(Number(guardado.total)).toBeCloseTo(Number(a.precio) + 2 * Number(b.precio), 2);

    // El carrito quedo vacio tras confirmar.
    await page.goto('/carrito');
    await expect(page.getByText('Todavía no agregaste productos.')).toBeVisible();

    // El barista ve la comanda y la avanza un paso.
    const contextoBarista = await browser.newContext();
    const panel = await contextoBarista.newPage();
    await entrar(panel, BARISTA);
    const tarjeta = panel.locator('.comanda', { hasText: ticket });
    await expect(tarjeta).toBeVisible();
    await captura(panel, 'IT-12c-panel-pendiente');
    await tarjeta.getByRole('button', { name: /Pasar a/ }).click();
    await expect(tarjeta.getByText('En preparación').first()).toBeVisible();
    await captura(panel, 'IT-12d-panel-en-preparacion');
    await contextoBarista.close();

    // El cliente lo ve en el seguimiento y la API coincide.
    await page.goto(`/seguimiento/${id}`);
    await expect(page.locator('.paso.actual')).toContainText('En preparación');
    await expect(page.locator('[data-testid=ticket]')).toHaveText(ticket);
    await captura(page, 'IT-12e-seguimiento');
    const tracker = await (await request.get(`${API}/pedidos/${id}/tracker`)).json();
    expect(tracker.estado).toBe('EN_PREPARACION');
  });

  test('IT-13 Pedido PICKUP guarda nombre y telefono del cliente', async ({ page }) => {
    const [a] = await productosUnicosDisponibles(request, 1);
    await page.goto('/carta');
    await agregarAlCarrito(page, a.nombre);
    await page.goto('/pedido');
    await page.check('#tipo-pickup');
    await page.fill('#nombre', 'Cliente E2E');
    await page.fill('#telefono', '987654321');
    await page.click('button[type=submit]');
    const ticket = (await page.locator('[data-testid=ticket]').innerText()).trim();
    const id = Number(ticket.replace('CDD-', ''));
    const guardado = await (await request.get(`${API}/pedidos/${id}`, { headers: auth(tokenBarista) })).json();
    expect(guardado.tipoPedido).toBe('PICKUP');
    expect(guardado.nombreCliente).toBe('Cliente E2E');
    expect(guardado.telefonoCliente).toBe('987654321');
    await captura(page, 'IT-13-pedido-pickup');
  });

  test('IT-14 El panel solo avanza un paso por vez (el backend rechaza saltos de estado)', async () => {
    const [a] = await productosUnicosDisponibles(request, 1);
    const creado = await (await request.post(`${API}/pedidos`, {
      data: { tipoPedido: 'LOCAL', numeroMesa: 3, detalles: [{ productoId: a.id, cantidad: 1 }] },
    })).json();
    const salto = await request.put(`${API}/pedidos/${creado.id}/estado`, { headers: auth(tokenBarista), data: { estado: 'ENTREGADO' } });
    expect(salto.status(), 'PENDIENTE -> ENTREGADO').toBe(422);
  });
});

test.describe('Fallas de comunicacion', () => {
  test('IT-15 Si el backend no responde, la carta explica el problema y permite reintentar', async ({ page }) => {
    await page.route('**/api/v1/**', (ruta) => ruta.abort('connectionrefused'));
    await page.goto('/carta');
    await expect(page.getByText(/No se pudo conectar con el servidor/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    await captura(page, 'IT-15-sin-conexion');

    await page.unroute('**/api/v1/**');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.locator('.producto-card').first()).toBeVisible();
  });

  test('IT-16 Seguimiento de un pedido inexistente muestra un mensaje comprensible', async ({ page }) => {
    await page.goto('/seguimiento/99999999');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await captura(page, 'IT-16-pedido-inexistente');
  });
});
