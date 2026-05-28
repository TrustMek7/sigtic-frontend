import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, UserProfile, Rol } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<LoginResponse | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly rol = computed(() => this._user()?.rol ?? null);
  readonly nombreCompleto = computed(() => this._user()?.nombre_completo ?? '');

  readonly esInformatica = computed(() => {
    const r = this.rol();
    return r === 'ADMIN' || r === 'JEFE_INFO' || r === 'ENCARGADO_INFO' || r === 'TECNICO';
  });

  readonly esJefeOEncargado = computed(() => {
    const r = this.rol();
    return r === 'ADMIN' || r === 'JEFE_INFO' || r === 'ENCARGADO_INFO';
  });

  readonly esJefe = computed(() => {
    const r = this.rol();
    return r === 'ADMIN' || r === 'JEFE_INFO';
  });

  readonly esAdmin = computed(() => this.rol() === 'ADMIN');

  hasRole(...roles: Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        tap(res => {
          this._user.set(res);
          this.router.navigate(['/dashboard']);
        }),
      );
  }

  logout() {
    return this.http.post(`${environment.apiUrl}/auth/logout/`, {}).pipe(
      tap(() => {
        this._user.set(null);
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        this._user.set(null);
        this.router.navigate(['/login']);
        return EMPTY;
      }),
    );
  }

  loadMe() {
    return this.http.get<UserProfile>(`${environment.apiUrl}/auth/me/`).pipe(
      tap(profile => {
        this._user.set({
          id: profile.id,
          nombre_completo: profile.nombre_completo,
          rol: profile.rol,
          rol_display: profile.rol_display,
        });
      }),
      catchError(() => {
        this._user.set(null);
        return EMPTY;
      }),
    );
  }

  refreshToken() {
    return this.http.post(`${environment.apiUrl}/auth/refresh/`, {});
  }
}
