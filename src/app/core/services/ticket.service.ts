import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  TicketList, TicketDetail, TicketCreate,
  TransicionPayload, DiagnosticoPayload, EstadoTicket,
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tickets`;

  list(filters: { estado?: string; tecnico?: number } = {}) {
    let params = new HttpParams();
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.tecnico) params = params.set('tecnico', filters.tecnico);
    return this.http.get<{ results: TicketList[]; count: number }>(`${this.base}/`, { params });
  }

  get(id: number) {
    return this.http.get<TicketDetail>(`${this.base}/${id}/`);
  }

  create(payload: TicketCreate) {
    return this.http.post<TicketDetail>(`${this.base}/`, payload);
  }

  transicion(id: number, payload: TransicionPayload) {
    return this.http.post<TicketDetail>(`${this.base}/${id}/transicion/`, payload);
  }

  diagnostico(id: number, payload: DiagnosticoPayload) {
    return this.http.post(`${this.base}/${id}/diagnostico/`, payload);
  }

  agregarAccion(id: number, payload: { tipo_accion: string; detalle: string }) {
    return this.http.post(`${this.base}/${id}/acciones/`, payload);
  }

  registrarTercerizado(id: number, payload: object) {
    return this.http.post(`${this.base}/${id}/tercerizado/`, payload);
  }

  generarDocumento(id: number) {
    return this.http.post<{ id: number; numero_documento: string; url: string }>(
      `${environment.apiUrl}/tickets/${id}/documento/`, {}
    );
  }
}
