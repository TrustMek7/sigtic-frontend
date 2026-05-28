import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="login-logo">
            <mat-icon>computer</mat-icon>
            <h1>SIGTIC</h1>
            <p>Sistema de Gestión de Tickets TI</p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Usuario (SIGGO)</mat-label>
              <input matInput formControlName="username" autocomplete="username">
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password"
                     [type]="showPassword() ? 'text' : 'password'"
                     autocomplete="current-password">
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (error()) {
              <div class="login-error">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Ingresar
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer>
          <p class="login-footer">Unidad de Informática y Sistemas</p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%);
    }
    .login-card { width: 100%; max-width: 400px; border-radius: 12px; }
    .login-logo {
      text-align: center;
      width: 100%;
      padding: 16px 0 8px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1F4E79; }
      h1 { margin: 4px 0; font-size: 28px; font-weight: 700; color: #1F4E79; }
      p { margin: 0; font-size: 13px; color: #666; }
    }
    mat-card-content form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 16px;
    }
    button[type=submit] { height: 44px; font-size: 15px; }
    .login-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #B71C1C;
      font-size: 13px;
      background: #FFEBEE;
      padding: 8px 12px;
      border-radius: 6px;
      mat-icon { font-size: 18px; }
    }
    .login-footer { text-align: center; font-size: 11px; color: #9E9E9E; padding: 8px; margin: 0; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.detail ?? 'Error al conectar con el servidor.'
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
