import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <!-- Blur blobs de fondo -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <!-- Card glassmorphism -->
      <div class="login-card">
        <div class="login-header">
          <div class="logo-circle">
            <img src="/img/Escudo-cayma.png" alt="Municipalidad Distrital de Cayma" />
          </div>
          <h1>Gestión Interna de Informática</h1>
          <p>Municipalidad Distrital de Cayma</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <mat-form-field appearance="outline" class="login-field">
            <mat-label>Usuario (SIGGO)</mat-label>
            <input matInput formControlName="username" autocomplete="username">
            <mat-icon matSuffix>person_outline</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="login-field">
            <mat-label>Contraseña</mat-label>
            <input matInput formControlName="password"
                   [type]="showPassword() ? 'text' : 'password'"
                   autocomplete="current-password">
            <button mat-icon-button matSuffix type="button"
                    (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <button class="btn-login" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              <mat-icon>login</mat-icon>
              Ingresar al sistema
            }
          </button>
        </form>

        <p class="login-footer">Unidad de Informática y Sistemas</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0D2550 0%, #1A3A8A 45%, #2563EB 80%, #0EA5E9 100%);
      background-size: 200% 200%;
      animation: gradientShift 12s ease infinite;
      overflow: hidden;
      position: relative;
    }

    /* Blur blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }
    .blob-1 {
      width: 480px; height: 480px;
      background: rgba(6,182,212,.22);
      top: -150px; right: -80px;
      animation: blobFloat 11s ease-in-out infinite;
    }
    .blob-2 {
      width: 400px; height: 400px;
      background: rgba(37,99,235,.28);
      bottom: -100px; left: -80px;
      animation: blobFloat 13s ease-in-out infinite reverse;
    }
    .blob-3 {
      width: 280px; height: 280px;
      background: rgba(124,58,237,.15);
      top: 45%; left: 38%;
      transform: translate(-50%,-50%);
      animation: blobFloat 9s ease-in-out 2s infinite;
    }

    /* Card glassmorphism */
    .login-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 420px;
      margin: 16px;
      background: rgba(255,255,255,.93);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,.55);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.08);
      padding: 36px 32px 28px;
      animation: fadeInUp 450ms cubic-bezier(.4,0,.2,1) both;
    }

    /* Header */
    .login-header {
      text-align: center;
      margin-bottom: 28px;
      h1 {
        margin: 12px 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: #0F172A;
        line-height: 1.3;
        letter-spacing: -.025em;
      }
      p { margin: 0; font-size: 12px; color: #64748B; }
    }

    .logo-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: white;
      padding: 8px;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(37,99,235,.2), 0 0 0 4px rgba(37,99,235,.07);
      display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: contain; }
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      animation: fadeIn 500ms 150ms both;
    }

    .login-field {
      width: 100%;
      --mdc-outlined-text-field-focus-outline-color: #2563EB;
      --mdc-outlined-text-field-focus-label-text-color: #2563EB;
      --mdc-outlined-text-field-outline-color: #CBD5E1;
    }

    /* Button */
    .btn-login {
      margin-top: 6px;
      width: 100%; height: 46px;
      background: linear-gradient(135deg, #2563EB 0%, #0284C7 60%, #06B6D4 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px; font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity .2s, transform .15s, box-shadow .2s;
      box-shadow: 0 4px 14px rgba(37,99,235,.38);
      mat-icon { font-size: 18px; }
      &:hover:not(:disabled) {
        opacity: .92;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(37,99,235,.48);
      }
      &:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 6px rgba(37,99,235,.3); }
      &:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    }

    .login-footer {
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      margin: 20px 0 0;
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  showPassword = signal(false);
  loading = signal(false);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Completa usuario y contraseña para continuar.');
      return;
    }
    this.loading.set(true);
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.detail ?? 'Error al conectar con el servidor.');
      },
      complete: () => this.loading.set(false),
    });
  }
}
