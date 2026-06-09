import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BienBaja, DispositivoList } from '../../shared/models';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-bajas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Bienes de Baja</h1>
    </div>

    <mat-card class="sigtic-card">
      <mat-card-title>Registrar Baja</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">

          <!-- Paso 1: ¿Registrado? -->
          <div class="full-width step-toggle">
            <span class="step-label">¿El dispositivo está registrado en el inventario?</span>
            <mat-button-toggle-group [value]="registrado()" (change)="onRegistradoChange($event.value)">
              <mat-button-toggle [value]="true">
                <mat-icon>inventory_2</mat-icon>&nbsp;Sí, tiene código
              </mat-button-toggle>
              <mat-button-toggle [value]="false">
                <mat-icon>device_unknown</mat-icon>&nbsp;Sin registro
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <!-- Paso 2a: registrado → autocomplete -->
          @if (registrado()) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Buscar dispositivo por código</mat-label>
              <input matInput formControlName="busqueda"
                     placeholder="PC-001, IMP-003..."
                     [matAutocomplete]="autoDisp"
                     autocomplete="off">
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete #autoDisp="matAutocomplete"
                                [displayWith]="displayFn"
                                (optionSelected)="seleccionarDispositivo($event)">
                @for (d of sugerencias(); track d.id) {
                  <mat-option [value]="d">
                    <div class="autocomplete-opt">
                      <strong>{{ d.cod_inventario }}</strong>
                      <span class="opt-tipo">{{ d.tipo_nombre }}</span>
                      <span class="opt-sede">{{ d.sede_nombre }}</span>
                    </div>
                  </mat-option>
                }
                @if (buscando()) {
                  <mat-option disabled>
                    <span style="display:flex;align-items:center;gap:8px">
                      <mat-spinner diameter="16"></mat-spinner> Buscando...
                    </span>
                  </mat-option>
                }
                @if (!buscando() && busquedaActiva() && sugerencias().length === 0) {
                  <mat-option disabled>Sin resultados para "{{ form.value.busqueda }}"</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            @if (dispositivo()) {
              <div class="dispositivo-card full-width">
                <mat-icon color="primary">devices</mat-icon>
                <div class="disp-info">
                  <strong>{{ dispositivo()!.cod_inventario }}</strong> — {{ dispositivo()!.tipo_nombre }}
                  <div class="disp-sede">{{ dispositivo()!.sede_nombre }}</div>
                </div>
                <button mat-icon-button type="button" (click)="limpiarDispositivo()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          }

          <!-- Paso 2b: sin registro → campos manuales -->
          @if (!registrado()) {
            <mat-form-field appearance="outline">
              <mat-label>Código referencial</mat-label>
              <input matInput formControlName="sr_cod_inventario">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Marca</mat-label>
              <input matInput formControlName="sr_marca">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Modelo</mat-label>
              <input matInput formControlName="sr_modelo">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Serie</mat-label>
              <input matInput formControlName="sr_serie">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="sr_descripcion" rows="2"></textarea>
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo de baja</mat-label>
            <textarea matInput formControlName="motivo" rows="3"
                      placeholder="Describe el motivo del retiro del inventario..."></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha de baja</mat-label>
            <input matInput formControlName="fecha" type="date">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lugar de origen</mat-label>
            <input matInput formControlName="lugar_origen" placeholder="Oficina, sede...">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones adicionales</mat-label>
            <textarea matInput formControlName="observacion" rows="2"></textarea>
          </mat-form-field>

          <div class="form-actions full-width">
            <button mat-raised-button color="warn" type="submit"
                    [disabled]="form.invalid || (registrado() && !dispositivo()) || submitting()">
              @if (submitting()) { <mat-spinner diameter="20" /> } @else { <mat-icon>delete_forever</mat-icon> }
              {{ submitting() ? '' : 'Registrar Baja' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Historial de bajas -->
    <mat-card class="sigtic-card">
      <mat-card-title>Historial de Bajas</mat-card-title>
      <mat-card-content>
        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="36" /></div>
        } @else if (bajas().length === 0) {
          <div class="empty-state" style="padding:30px">
            <mat-icon>delete_outline</mat-icon><p>Sin bienes de baja registrados</p>
          </div>
        } @else {
          <table mat-table [dataSource]="bajas()">
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let b">{{ b.fecha }}</td>
            </ng-container>
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let b">
                {{ b.dispositivo_cod || b.sr_cod_inventario || '—' }}
                @if (b.sin_registro) { <span class="badge badge-rechazado" style="margin-left:6px">Sin Reg.</span> }
              </td>
            </ng-container>
            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef>Motivo</th>
              <td mat-cell *matCellDef="let b" style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ b.motivo }}
              </td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let b">
                <span [class]="'badge ' + estadoBadge(b.estado)">{{ b.estado }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="registrado_por">
              <th mat-header-cell *matHeaderCellDef>Registrado por</th>
              <td mat-cell *matCellDef="let b">{{ b.registrado_por_nombre }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="bajaCols"></tr>
            <tr mat-row *matRowDef="let row; columns: bajaCols;"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .step-toggle { display: flex; flex-direction: column; gap: 10px; padding: 4px 0 12px; }
    .step-label { font-size: 14px; font-weight: 500; color: var(--c-text-muted, #64748B); }
    mat-button-toggle-group { border-radius: 8px; }
    mat-button-toggle { font-size: 13px; }
    .autocomplete-opt { display: flex; align-items: center; gap: 10px; font-size: 13px; min-width: 0; }
    .opt-tipo { color: #64748B; }
    .opt-sede { margin-left: auto; font-size: 11px; color: #94A3B8; white-space: nowrap; }
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    table { width: 100%; }
    td.mat-cell { font-size: 13px; }
    .dispositivo-card {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: #E3F2FD;
      border-radius: 8px; border-left: 4px solid #1565C0;
    }
    .disp-info { flex: 1; }
    .disp-sede { font-size: 12px; color: #666; }
  `],
})
export class BajasComponent implements OnInit {
  private http = inject(HttpClient);
  private inventarioService = inject(InventarioService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  bajas = signal<BienBaja[]>([]);
  loading = signal(true);
  submitting = signal(false);
  dispositivo = signal<DispositivoList | null>(null);
  sugerencias = signal<DispositivoList[]>([]);
  registrado = signal(true);
  buscando = signal(false);
  busquedaActiva = signal(false);

  bajaCols = ['fecha', 'codigo', 'motivo', 'estado', 'registrado_por'];

  form = this.fb.group({
    busqueda: [''],
    sr_cod_inventario: [''],
    sr_descripcion: [''],
    sr_marca: [''],
    sr_modelo: [''],
    sr_serie: [''],
    motivo: ['', [Validators.required, Validators.minLength(10)]],
    fecha: [new Date().toISOString().slice(0, 10), Validators.required],
    lugar_origen: [''],
    observacion: [''],
  });

  private base = `${environment.apiUrl}/inventario`;

  ngOnInit() {
    this.form.get('busqueda')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.dispositivo.set(null);
        if (!q || typeof q !== 'string' || q.length < 2) {
          this.sugerencias.set([]);
          this.busquedaActiva.set(false);
          this.buscando.set(false);
          return of(null);
        }
        this.buscando.set(true);
        this.busquedaActiva.set(true);
        return this.inventarioService.buscarPorCodigo(q).pipe(catchError(() => of(null)));
      }),
    ).subscribe(res => {
      this.buscando.set(false);
      this.sugerencias.set(res?.results ?? []);
    });

    this.loadBajas();
  }

  displayFn = (d: DispositivoList | string | null): string => {
    if (!d) return '';
    if (typeof d === 'string') return d;
    return d.cod_inventario;
  };

  onRegistradoChange(value: boolean) {
    this.registrado.set(value);
    this.limpiarDispositivo();
  }

  seleccionarDispositivo(event: MatAutocompleteSelectedEvent) {
    const d = event.option.value as DispositivoList;
    this.dispositivo.set(d);
    this.sugerencias.set([]);
    this.busquedaActiva.set(false);
  }

  limpiarDispositivo() {
    this.dispositivo.set(null);
    this.sugerencias.set([]);
    this.busquedaActiva.set(false);
    this.form.get('busqueda')!.setValue('', { emitEvent: false });
  }

  private loadBajas() {
    this.http.get<{ results: BienBaja[] }>(`${this.base}/bajas/`).subscribe({
      next: res => { this.bajas.set(res.results ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: Record<string, unknown> = {
      sin_registro: !this.registrado(),
      motivo: v.motivo,
      fecha: v.fecha,
      lugar_origen: v.lugar_origen,
      observacion: v.observacion,
    };
    if (this.registrado()) {
      if (!this.dispositivo()) return;
      payload['dispositivo'] = this.dispositivo()!.id;
    } else {
      payload['sr_cod_inventario'] = v.sr_cod_inventario;
      payload['sr_descripcion'] = v.sr_descripcion;
      payload['sr_marca'] = v.sr_marca;
      payload['sr_modelo'] = v.sr_modelo;
      payload['sr_serie'] = v.sr_serie;
    }

    this.submitting.set(true);
    this.http.post<BienBaja>(`${this.base}/bajas/`, payload).subscribe({
      next: () => {
        this.toast.success('Baja registrada correctamente.');
        this.form.reset({ fecha: new Date().toISOString().slice(0, 10) });
        this.registrado.set(true);
        this.limpiarDispositivo();
        this.submitting.set(false);
        this.loading.set(true);
        this.loadBajas();
      },
      error: err => {
        this.submitting.set(false);
        this.toast.error(err?.error?.detail ?? 'Error al registrar baja.');
      },
    });
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'badge-en_revision',
      APROBADO: 'badge-asignado',
      PROCESADO: 'badge-finalizado',
    };
    return map[estado] ?? '';
  }
}
