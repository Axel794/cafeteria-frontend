import { Routes } from '@angular/router';
import { rolGuard } from './core/rol.guard';
import { AdminCategorias } from './pages/admin-categorias/admin-categorias';
import { AdminProductos } from './pages/admin-productos/admin-productos';
import { Aviso } from './pages/aviso/aviso';
import { Carrito } from './pages/carrito/carrito';
import { Carta } from './pages/carta/carta';
import { Login } from './pages/login/login';
import { NuevoPedido } from './pages/nuevo-pedido/nuevo-pedido';
import { Panel } from './pages/panel/panel';
import { Seguimiento } from './pages/seguimiento/seguimiento';

/**
 * Mapa de navegacion de la aplicacion.
 *  Publicas : carta, carrito, pedido, seguimiento, login
 *  Personal : panel de comandas (barista o administrador)
 *  Admin    : administracion de categorias y productos (solo administrador)
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'carta' },

  { path: 'carta', component: Carta, title: 'Carta · Como dice el dicho' },
  { path: 'carrito', component: Carrito, title: 'Mi pedido' },
  { path: 'pedido', component: NuevoPedido, title: 'Confirmar pedido' },
  { path: 'seguimiento', component: Seguimiento, title: 'Seguimiento de pedido' },
  { path: 'seguimiento/:id', component: Seguimiento, title: 'Seguimiento de pedido' },
  { path: 'login', component: Login, title: 'Acceso del personal' },

  {
    path: 'panel',
    component: Panel,
    canActivate: [rolGuard('BARISTA', 'ADMINISTRADOR')],
    title: 'Panel de comandas',
  },
  {
    path: 'admin/categorias',
    component: AdminCategorias,
    canActivate: [rolGuard('ADMINISTRADOR')],
    title: 'Administrar categorías',
  },
  {
    path: 'admin/productos',
    component: AdminProductos,
    canActivate: [rolGuard('ADMINISTRADOR')],
    title: 'Administrar productos',
  },
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/productos' },

  {
    path: 'sin-permiso',
    component: Aviso,
    data: {
      titulo: 'No tienes permiso',
      texto: 'Tu usuario no puede entrar a esta sección. Si crees que es un error, avisa al administrador.',
    },
    title: 'Sin permiso',
  },
  {
    path: '**',
    component: Aviso,
    data: { titulo: 'Página no encontrada', texto: 'La dirección que escribiste no existe en esta aplicación.' },
    title: 'No encontrada',
  },
];
