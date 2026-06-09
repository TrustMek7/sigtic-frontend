import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserProfile, EncargadoActivo } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  me() {
    return this.http.get<UserProfile>(`${this.base}/me/`);
  }

  list(filters: Record<string, unknown> = {}) {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params[k] = String(v);
    }
    return this.http.get<{ count: number; results: UserProfile[] }>(`${this.base}/users/`, { params });
  }

  updateRol(id: number, rol: string) {
    return this.http.patch<UserProfile>(`${this.base}/users/${id}/`, { rol });
  }

  listTecnicos() {
    return this.list({ rol: 'TECNICO', activo: true, page_size: 100 }).pipe(map(r => r.results));
  }

  listUsuariosIT() {
    return this.list({ activo: true, page_size: 100 }).pipe(
      map(r => r.results.filter(u => ['JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'].includes(u.rol)))
    );
  }

  /** Solo TECNICO y ENCARGADO_INFO activos — para el select de delegación */
  listDelegables() {
    return this.http.get<UserProfile[]>(`${this.base}/users/delegables/`);
  }

  encargados() {
    return this.http.get<EncargadoActivo[]>(`${this.base}/encargados/`);
  }

  encargadoActivo() {
    return this.http.get<EncargadoActivo | null>(`${this.base}/encargados/activo/`, {
      observe: 'response',
    });
  }

  crearEncargado(payload: object) {
    return this.http.post<EncargadoActivo>(`${this.base}/encargados/`, payload);
  }

  retomarCargo() {
    return this.http.delete(`${this.base}/encargados/activo/`);
  }

  desactivarEncargado(id: number) {
    return this.http.delete(`${this.base}/encargados/${id}/`);
  }
}
