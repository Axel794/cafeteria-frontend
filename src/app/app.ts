import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';

/** Componente raiz: barra de navegacion + zona donde el router muestra cada pantalla. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CartService);
  private readonly router = inject(Router);

  /** En pantallas pequeñas el menu se despliega con el boton de hamburguesa. */
  protected readonly menuAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.cerrarMenu();
    void this.router.navigate(['/carta']);
  }
}
