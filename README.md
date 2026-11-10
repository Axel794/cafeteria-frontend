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

Otros comandos: `npm test` (8 pruebas Vitest) · `npm run build` (compila a `dist/`).

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
