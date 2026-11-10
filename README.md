# Cafetería «Como dice el dicho» — Frontend Angular (Práctica de Campo 4)

Cliente web (Angular 22 + Bootstrap 5) que consume la API Spring Boot de `cafeteria-backend` (rama `practica-3`).

## Requisitos
- Node.js **22.22.3+** (o 24.15+) y npm
- Backend corriendo en `http://localhost:8080` (IntelliJ → `CafeteriaApiApplication`)

## Cómo ejecutarlo (Windows)
```bat
cd cafeteria-frontend
npm install
npm start
```
Abrir http://localhost:4200. La URL de la API se cambia en `src/environments/environment.ts`.
El backend ya permite CORS para `http://localhost:4200`.

Usuarios de prueba (solo desarrollo): `admin / Admin123*` y `barista / Barista123*`.

Otros comandos: `npm test` (8 pruebas Vitest) · `npm run build` (compila a `dist/`) · `npm run e2e` (pruebas de integración, ver abajo).

## Pantallas y rutas
| Ruta | Quién | Qué hace |
|---|---|---|
| `/carta` | Público | Carta por categorías, filtro, agregar al pedido |
| `/carrito` | Público | Cantidades (máx. 20), notas, quitar, total estimado |
| `/pedido` | Público | Formulario reactivo LOCAL (mesa) / PICKUP (nombre + teléfono) → ticket |
| `/seguimiento/:id` | Público | Estado del pedido (acepta `CDD-000012` o `12`), se refresca cada 10 s |
| `/login` | Personal | JWT; redirige según rol |
| `/panel` | Barista/Admin | Comandas, filtro por estado, avanzar un paso, refresco cada 15 s |
| `/admin/productos`, `/admin/categorias` | Admin | Crear, editar, eliminar con validación |

## Estructura
```
src/app/
  core/      modelos (DTO), servicios HTTP, auth, interceptor JWT, guard de roles, carrito
  pages/     una carpeta por pantalla (carta, carrito, nuevo-pedido, seguimiento, login, panel, admin-*)
  shared/    componentes reutilizables (pestañas de administración)
```
Conceptos usados: componentes standalone, signals, `@if/@for`, interpolación `{{ }}`, property binding `[ ]`,
event binding `( )`, Reactive Forms con validadores, `HttpClient` + interceptor funcional, guards, routing.

## Limitaciones conocidas / pendientes de integración
- `GET /categorias` solo devuelve activas: el admin no puede ver ni reactivar categorías inactivas.
- El número de ticket se convierte a id quitando `CDD-` (depende del formato del backend).
- La moneda `S/` es una suposición (`environment.moneda`).
- El token JWT vive en `localStorage` (simple para el curso; en producción conviene cookie HttpOnly).
- Sin refresh token: al expirar (120 min) se pide iniciar sesión de nuevo.
- Falta integrar con el módulo de usuarios/cupones del compañero (rama `main`).
- `evidencias-mock/` son capturas contra una **API simulada** (`tools/mock-api.mjs`), NO contra el backend real.


## Pruebas de integración (Práctica de Campo 5)
Las 16 pruebas de `e2e/integracion.spec.ts` (Playwright) manejan el navegador como un usuario y luego consultan la API para confirmar que el dato **quedó guardado** (o se borró) en el backend: consulta, CRUD de productos y categorías, validaciones, login y roles (401/403), flujo pedido → panel → seguimiento y fallas de comunicación.

Primera vez (Windows):
```bat
npm install
npx playwright install chromium
```
Con el backend (rama `practica-3`) corriendo en el puerto 8080:
```bat
npm run e2e
npm run e2e:informe
```
- Si el frontend no está levantado, Playwright lo arranca solo con `npm start`.
- Las capturas de cada escenario quedan en `e2e-evidencias/` y el informe HTML en `playwright-report/`.
- Las pruebas limpian los productos y categorías que crean. Los pedidos que generan quedan guardados (el backend no permite borrarlos).
- Otros usuarios o URL: variables `API_URL`, `ADMIN_USER`, `ADMIN_PASS`, `BARISTA_USER`, `BARISTA_PASS`.

## Defectos corregidos en la PC5
- El nombre de categoría permitía 100 caracteres pero el backend acepta 80: ahora el formulario valida 80.
- El campo de seguimiento mostraba el id (`7`) en vez del ticket (`CDD-000007`).
- El pie de página subía a la mitad de la pantalla en vistas cortas.
