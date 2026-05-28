import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Marca, TipoDispositivo, SistemaOperativo, Procesador, MemoriaRam, Consumible, Sede, UnidadOrganica } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalogo`;
  private orgBase = `${environment.apiUrl}/organizacion`;

  marcas$ = this.http.get<Marca[]>(`${this.base}/marcas/`).pipe(shareReplay(1));
  tipos$ = this.http.get<TipoDispositivo[]>(`${this.base}/tipos-dispositivo/`).pipe(shareReplay(1));
  sos$ = this.http.get<SistemaOperativo[]>(`${this.base}/sistemas-operativos/`).pipe(shareReplay(1));
  procesadores$ = this.http.get<Procesador[]>(`${this.base}/procesadores/`).pipe(shareReplay(1));
  memorias$ = this.http.get<MemoriaRam[]>(`${this.base}/memorias-ram/`).pipe(shareReplay(1));
  consumibles$ = this.http.get<Consumible[]>(`${this.base}/consumibles/`).pipe(shareReplay(1));
  sedes$ = this.http.get<Sede[]>(`${this.orgBase}/sedes/`).pipe(shareReplay(1));
  unidades$ = this.http.get<UnidadOrganica[]>(`${this.orgBase}/unidades/`).pipe(shareReplay(1));
}
