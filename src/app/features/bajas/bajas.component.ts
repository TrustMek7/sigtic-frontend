import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Bienes de Baja</h1>
    </div>

    <!-- Formulario de registro -->
    <mat-card class="sigtic-card">
      <mat-card-title>Registrar Baja</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
          <!-- Toggle sin registro -->
          <div class="full-width" style="padding: 4px 0 8px">
            <mat-checkbox formControlName="sin_registro" (change)="onSinRegistroChange()">
              Dispositivo <strong>sin código de inventario</strong>
            </mat-checkbox>
          </div>

          @if (!form.value.sin_registro) {
            <!-- Búsqueda por código -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código de inventario</mat-label>
              <input matInput formControlName="busqueda" placeholder="PC-001, IMP-003...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            @if (dispositivo()) {
              <div class="dispositivo-card full-width">
                <mat-icon color="primary">devices</mat-icon>
                <div>
                  <strong>{{ dispositivo()!.cod_inventario }}</strong> — {{ dispositivo()!.tipo_nombre }}
                  <div style="font-size:12px;color:#666">{{ dispositivo()!.sede_nombre }}</div>
                </div>
              </div>
            }
          } @else {
            <!-- Campos manuales para sin registro -->
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
                    [disabled]="form.invalid || (!dispositivo() && !form.value.sin_registro) || submitting()">
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
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    table { width: 100%; }
    td.mat-cell { font-size: 13px; }
    .dispositivo-card {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: #E3F2FD;
      border-radius: 8px; border-left: 4px solid #1565C0;
    }
  `],
})
export class BajasComponent implements OnInit {
  private http = inject(HttpClient);
  private inventarioService = inject(InventarioService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  bajas = signal<BienBaja[]>([]);
  loading = signal(true);
  submitting = signal(false);
  dispositivo = signal<DispositivoList | null>(null);

  bajaCols = ['fecha', 'codigo', 'motivo', 'estado', 'registrado_por'];

  form = this.fb.group({
    sin_registro: [false],
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
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 3) { this.dispositivo.set(null); return of(null); }
        return this.inventarioService.buscarPorCodigo(q).pipe(catchError(() => of(null)));
      }),
    ).subscribe(res => {
      const items = res?.results ?? [];
      this.dispositivo.set(items.length === 1 ? items[0] : null);
    });

    this.loadBajas();
  }

  onSinRegistroChange() {
    this.dispositivo.set(null);
    this.form.get('busqueda')?.setValue('');
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
      sin_registro: v.sin_registro,
      motivo: v.motivo,
      fecha: v.fecha,
      lugar_origen: v.lugar_origen,
      observacion: v.observacion,
    };
    if (!v.sin_registro) {
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
        this.snackBar.open('Baja registrada correctamente', 'OK', { duration: 3000 });
        this.form.reset({ sin_registro: false, fecha: new Date().toISOString().slice(0, 10) });
        this.dispositivo.set(null);
        this.submitting.set(false);
        this.loading.set(true);
        this.loadBajas();
      },
      error: err => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error al registrar', 'Cerrar', { duration: 4000 });
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
