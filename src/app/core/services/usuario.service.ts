import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserProfile, EncargadoActivo } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  me() {
    return this.http.get<UserProfile>(`${this.base}/me/`);
  }

  list(filters: { rol?: string; activo?: boolean } = {}) {
    const params: Record<string, string> = {};
    if (filters.rol) params['rol'] = filters.rol;
    if (filters.activo !== undefined) params['activo'] = String(filters.activo);
    return this.http.get<UserProfile[]>(`${this.base}/users/`, { params });
  }

  updateRol(id: number, rol: string) {
    return this.http.patch<UserProfile>(`${this.base}/users/${id}/`, { rol });
  }

  listTecnicos() {
    return this.list({ rol: 'TECNICO', activo: true });
  }

  encargados() {
    return this.http.get<EncargadoActivo[]>(`${this.base}/encargados/`);
  }

  crearEncargado(payload: object) {
    return this.http.post<EncargadoActivo>(`${this.base}/encargados/`, payload);
  }

  desactivarEncargado(id: number) {
    return this.http.delete(`${this.base}/encargados/${id}/`);
  }
}
