import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DispositivoList, DispositivoDetail } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/inventario`;

  list(filters: { tipo?: string; estado?: string; sede?: number; q?: string } = {}) {
    let params = new HttpParams();
    if (filters.tipo)   params = params.set('tipo', filters.tipo);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.sede)   params = params.set('sede', filters.sede);
    if (filters.q)      params = params.set('q', filters.q);
    return this.http.get<{ results: DispositivoList[]; count: number }>(
      `${this.base}/dispositivos/`, { params }
    );
  }

  get(id: number) {
    return this.http.get<DispositivoDetail>(`${this.base}/dispositivos/${id}/`);
  }

  create(payload: object) {
    return this.http.post<DispositivoDetail>(`${this.base}/dispositivos/`, payload);
  }

  update(id: number, payload: object) {
    return this.http.patch<DispositivoDetail>(`${this.base}/dispositivos/${id}/`, payload);
  }

  getSubtabla(id: number) {
    return this.http.get<object>(`${this.base}/dispositivos/${id}/subtabla/`);
  }

  saveSubtabla(id: number, payload: object) {
    return this.http.put<object>(`${this.base}/dispositivos/${id}/subtabla/`, payload);
  }

  buscarPorCodigo(cod: string) {
    return this.http.get<{ results: DispositivoList[] }>(
      `${this.base}/dispositivos/`, { params: { q: cod } }
    );
  }
}
