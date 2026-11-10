import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Pantalla simple para "sin permiso" y "no encontrada"; el texto llega desde `data` de la ruta. */
@Component({
  selector: 'app-aviso',
  imports: [RouterLink],
  template: `
    <div class="text-center py-5">
      <h1 class="h3">{{ datos['titulo'] }}</h1>
      <p class="text-secondary">{{ datos['texto'] }}</p>
      <a class="btn btn-primary" routerLink="/carta">Volver a la carta</a>
    </div>
  `,
})
export class Aviso {
  protected readonly datos = inject(ActivatedRoute).snapshot.data;
}
