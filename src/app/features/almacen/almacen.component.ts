import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { SlicePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { StockConsumible, MovimientoStock } from '../../shared/models';

@Component({
  selector: 'app-almacen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SlicePipe,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Almacén de Consumibles</h1>
    </div>

    <!-- Stock actual -->
    <mat-card class="sigtic-card">
      <mat-card-title>Stock Actual</mat-card-title>
      <mat-card-content>
        @if (loadingStock()) {
          <div class="loading-center"><mat-spinner diameter="36" /></div>
        } @else {
          <table mat-table [dataSource]="stock()">
            <ng-container matColumnDef="consumible">
              <th mat-header-cell *matHeaderCellDef>Consumible</th>
              <td mat-cell *matCellDef="let s">
                <strong>{{ s.consumible_nombre }}</strong>
                <span style="color:#9E9E9E;font-size:11px;margin-left:8px">{{ s.consumible_tipo }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="marca">
              <th mat-header-cell *matHeaderCellDef>Marca</th>
              <td mat-cell *matCellDef="let s">{{ s.marca_nombre || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="stock_actual">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let s">
                <span [style.color]="s.bajo_minimo ? '#B71C1C' : '#2E7D32'" [style.font-weight]="'600'">
                  {{ s.stock_actual }}
                </span>
                @if (s.bajo_minimo) { <mat-icon style="font-size:16px;color:#B71C1C;vertical-align:middle">warning</mat-icon> }
              </td>
            </ng-container>
            <ng-container matColumnDef="stock_minimo">
              <th mat-header-cell *matHeaderCellDef>Mínimo</th>
              <td mat-cell *matCellDef="let s">{{ s.stock_minimo }}</td>
            </ng-container>
            <ng-container matColumnDef="orden_compra">
              <th mat-header-cell *matHeaderCellDef>O/C</th>
              <td mat-cell *matCellDef="let s">{{ s.orden_compra || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button color="primary" (click)="openMovimiento(s, 'INGRESO')" matTooltip="Registrar ingreso">
                  <mat-icon>add_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="openMovimiento(s, 'SALIDA')" matTooltip="Registrar salida">
                  <mat-icon>remove_circle</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="stockCols"></tr>
            <tr mat-row *matRowDef="let row; columns: stockCols;"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>

    <!-- Panel de movimiento -->
    @if (movimientoOpen()) {
      <mat-card class="sigtic-card">
        <mat-card-title>
          {{ movimientoTipo() === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Salida' }} —
          {{ stockSeleccionado()?.consumible_nombre }}
        </mat-card-title>
        <mat-card-content>
          <form [formGroup]="movForm" (ngSubmit)="onMovimiento()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" formControlName="cantidad" min="1">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Referencia</mat-label>
              <input matInput formControlName="referencia" placeholder="Nro de guía, ticket, etc.">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observación</mat-label>
              <textarea matInput formControlName="observacion" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions full-width">
              <button mat-button type="button" (click)="movimientoOpen.set(false)">Cancelar</button>
              <button mat-raised-button [color]="movimientoTipo() === 'INGRESO' ? 'primary' : 'warn'"
                      type="submit" [disabled]="movForm.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20" /> } @else { <mat-icon>save</mat-icon> }
                {{ submitting() ? '' : 'Confirmar' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <!-- Últimos movimientos -->
    <mat-card class="sigtic-card">
      <mat-card-title>Últimos Movimientos</mat-card-title>
      <mat-card-content>
        @if (loadingMovs()) {
          <div class="loading-center"><mat-spinner diameter="36" /></div>
        } @else if (movimientos().length === 0) {
          <div class="empty-state" style="padding:30px">
            <mat-icon>history</mat-icon><p>Sin movimientos registrados</p>
          </div>
        } @else {
          <table mat-table [dataSource]="movimientos()">
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let m">{{ m.fecha | slice:0:10 }}</td>
            </ng-container>
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let m">
                <span [class]="m.tipo === 'INGRESO' ? 'badge badge-solucionado' : 'badge badge-rechazado'">
                  {{ m.tipo }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="consumible">
              <th mat-header-cell *matHeaderCellDef>Consumible</th>
              <td mat-cell *matCellDef="let m">{{ m.consumible_nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="cantidad">
              <th mat-header-cell *matHeaderCellDef>Cantidad</th>
              <td mat-cell *matCellDef="let m">{{ m.cantidad }}</td>
            </ng-container>
            <ng-container matColumnDef="registrado_por">
              <th mat-header-cell *matHeaderCellDef>Registrado por</th>
              <td mat-cell *matCellDef="let m">{{ m.registrado_por_nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="referencia">
              <th mat-header-cell *matHeaderCellDef>Referencia</th>
              <td mat-cell *matCellDef="let m">{{ m.referencia || '—' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="movCols"></tr>
            <tr mat-row *matRowDef="let row; columns: movCols;"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    table { width: 100%; }
    th.mat-header-cell { font-size: 12px; font-weight: 600; color: #666; }
    td.mat-cell { font-size: 13px; }
  `],
})
export class AlmacenComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  stock = signal<StockConsumible[]>([]);
  movimientos = signal<MovimientoStock[]>([]);
  loadingStock = signal(true);
  loadingMovs = signal(true);
  submitting = signal(false);
  movimientoOpen = signal(false);
  movimientoTipo = signal<'INGRESO' | 'SALIDA'>('INGRESO');
  stockSeleccionado = signal<StockConsumible | null>(null);

  stockCols = ['consumible', 'marca', 'stock_actual', 'stock_minimo', 'orden_compra', 'acciones'];
  movCols = ['fecha', 'tipo', 'consumible', 'cantidad', 'registrado_por', 'referencia'];

  movForm = this.fb.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    referencia: [''],
    observacion: [''],
  });

  private base = `${environment.apiUrl}/almacen`;

  ngOnInit() {
    this.loadStock();
    this.loadMovimientos();
  }

  private loadStock() {
    this.http.get<{ results: StockConsumible[] }>(`${this.base}/stock/`).subscribe({
      next: res => { this.stock.set(res.results ?? []); this.loadingStock.set(false); },
      error: () => this.loadingStock.set(false),
    });
  }

  private loadMovimientos() {
    this.http.get<{ results: MovimientoStock[] }>(`${this.base}/movimientos/?limit=50`).subscribe({
      next: res => { this.movimientos.set(res.results ?? []); this.loadingMovs.set(false); },
      error: () => this.loadingMovs.set(false),
    });
  }

  openMovimiento(s: StockConsumible, tipo: 'INGRESO' | 'SALIDA') {
    this.stockSeleccionado.set(s);
    this.movimientoTipo.set(tipo);
    this.movForm.reset({ cantidad: 1, referencia: '', observacion: '' });
    this.movimientoOpen.set(true);
  }

  onMovimiento() {
    if (this.movForm.invalid || !this.stockSeleccionado()) return;
    this.submitting.set(true);
    const payload = {
      stock_consumible: this.stockSeleccionado()!.id,
      tipo: this.movimientoTipo(),
      ...this.movForm.value,
    };
    this.http.post<MovimientoStock>(`${this.base}/movimientos/`, payload).subscribe({
      next: () => {
        this.snackBar.open('Movimiento registrado', 'OK', { duration: 2500 });
        this.submitting.set(false);
        this.movimientoOpen.set(false);
        this.loadingStock.set(true);
        this.loadingMovs.set(true);
        this.loadStock();
        this.loadMovimientos();
      },
      error: err => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
