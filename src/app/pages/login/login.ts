import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';

/** Acceso del personal. Los queries ?redirect= y ?expirada= llegan como inputs de la ruta. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  readonly redirect = input<string>();
  readonly expirada = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (resp) => {
        this.enviando.set(false);
        const destino = this.redirect();
        if (destino && destino.startsWith('/') && !destino.startsWith('//')) {
          void this.router.navigateByUrl(destino);
        } else {
          void this.router.navigateByUrl(resp.rol === 'ADMINISTRADOR' ? '/admin/productos' : '/panel');
        }
      },
      error: (e: unknown) => {
        this.error.set(mensajeDeError(e));
        this.enviando.set(false);
      },
    });
  }
}
