import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { DispositivoList } from '../../../shared/models';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento' },
  { value: 'DE_BAJA', label: 'De Baja' },
  { value: 'ALMACEN', label: 'Almacén' },
];

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'COMPUTADORA', label: 'Computadora' },
  { value: 'IMPRESORA', label: 'Impresora' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'PERIFERICO', label: 'Periférico' },
  { value: 'RED', label: 'Red/Redes' },
  { value: 'CAMARA', label: 'Cámara' },
  { value: 'TELEFONO', label: 'Teléfono' },
];

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatCardModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Inventario</h1>
      @if (auth.esInformatica()) {
        <button mat-raised-button color="primary" routerLink="/inventario/nuevo">
          <mat-icon>add</mat-icon> Nuevo Dispositivo
        </button>
      }
    </div>

    <div class="filters sigtic-card">
      <mat-form-field appearance="outline">
        <mat-label>Buscar (código, marca, modelo)</mat-label>
        <input matInput [formControl]="searchCtrl" placeholder="PC-001...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select [formControl]="tipoCtrl">
          @for (t of tipos; track t.value) {
            <mat-option [value]="t.value">{{ t.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="estadoCtrl">
          @for (e of estados; track e.value) {
            <mat-option [value]="e.value">{{ e.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <div class="table-container">
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (dispositivos().length === 0) {
        <div class="empty-state">
          <mat-icon>devices</mat-icon>
          <p>No hay dispositivos con los filtros seleccionados</p>
        </div>
      } @else {
        <table mat-table [dataSource]="dispositivos()">
          <ng-container matColumnDef="cod_inventario">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let d">
              <a [routerLink]="['/inventario', d.id]" class="ticket-link">{{ d.cod_inventario }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let d">{{ d.tipo_nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="marca_modelo">
            <th mat-header-cell *matHeaderCellDef>Marca / Modelo</th>
            <td mat-cell *matCellDef="let d">
              {{ d.marca_nombre || '—' }} {{ d.modelo || '' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let d">
              <span [class]="'badge ' + estadoBadge(d.estado)">{{ d.estado }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="sede">
            <th mat-header-cell *matHeaderCellDef>Sede</th>
            <td mat-cell *matCellDef="let d">{{ d.sede_nombre || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="responsable">
            <th mat-header-cell *matHeaderCellDef>Responsable</th>
            <td mat-cell *matCellDef="let d">{{ d.responsable_nombre || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              <button mat-icon-button [routerLink]="['/inventario', d.id]">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"
              [routerLink]="['/inventario', row.id]"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 0; padding: 16px; }
    .filters mat-form-field { min-width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 40px; background: white; }
    .ticket-link { color: var(--mat-sys-primary); font-weight: 500; text-decoration: none; }
    .ticket-link:hover { text-decoration: underline; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #F5F5F5; }
  `],
})
export class InventarioListComponent implements OnInit {
  auth = inject(AuthService);
  private inventarioService = inject(InventarioService);

  dispositivos = signal<DispositivoList[]>([]);
  loading = signal(true);
  estados = ESTADOS;
  tipos = TIPOS;

  searchCtrl = new FormControl('');
  tipoCtrl = new FormControl('');
  estadoCtrl = new FormControl('');

  columns = ['cod_inventario', 'tipo', 'marca_modelo', 'estado', 'sede', 'responsable', 'acciones'];

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.load());
    this.tipoCtrl.valueChanges.subscribe(() => this.load());
    this.estadoCtrl.valueChanges.subscribe(() => this.load());
    this.load();
  }

  private load() {
    this.loading.set(true);
    const q = this.searchCtrl.value || undefined;
    const tipo = this.tipoCtrl.value || undefined;
    const estado = this.estadoCtrl.value || undefined;
    this.inventarioService.list({ q, tipo, estado }).subscribe({
      next: res => { this.dispositivos.set(res.results ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      OPERATIVO: 'badge-solucionado',
      EN_MANTENIMIENTO: 'badge-en_mantenimiento',
      DE_BAJA: 'badge-rechazado',
      ALMACEN: 'badge-en_revision',
    };
    return map[estado] ?? 'badge-asignado';
  }
}
