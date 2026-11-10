import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Pestañas de la zona de administracion, compartidas por sus pantallas. */
@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" routerLink="/admin/productos" routerLinkActive="active">Productos</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" routerLink="/admin/categorias" routerLinkActive="active">Categorías</a>
      </li>
    </ul>
  `,
})
export class AdminNav {}
