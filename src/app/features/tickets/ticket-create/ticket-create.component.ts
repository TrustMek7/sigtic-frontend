import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { TicketService } from '../../../core/services/ticket.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { DispositivoList } from '../../../shared/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Crear Ticket</h1>
      <button mat-button routerLink="/tickets"><mat-icon>arrow_back</mat-icon> Volver</button>
    </div>

    <mat-card class="sigtic-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">

          <!-- Búsqueda dispositivo por código -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Código de inventario del dispositivo</mat-label>
            <input matInput formControlName="busqueda"
                   placeholder="Ej: PC-001, IMP-003..."
                   autocomplete="off">
            <mat-icon matSuffix>search</mat-icon>
            <mat-hint>Ingresa el código para buscar el dispositivo</mat-hint>
          </mat-form-field>

          @if (dispositivo()) {
            <div class="dispositivo-card full-width">
              <mat-icon color="primary">devices</mat-icon>
              <div>
                <strong>{{ dispositivo()!.cod_inventario }}</strong> — {{ dispositivo()!.tipo_nombre }}
                @if (dispositivo()!.marca_nombre) { <span>· {{ dispositivo()!.marca_nombre }}</span> }
                {{ dispositivo()!.modelo }}
                <div class="dispositivo-meta">
                  <span>{{ dispositivo()!.sede_nombre }}</span>
                  @if (dispositivo()!.responsable_nombre) {
                    <span>· Resp: {{ dispositivo()!.responsable_nombre }}</span>
                  }
                </div>
              </div>
            </div>
          }

          @if (ipWarning()) {
            <div class="ip-warning full-width">
              <mat-icon>warning</mat-icon>
              La IP del dispositivo no coincide con tu IP. Verifica que estés usando el equipo correcto.
            </div>
          }

          <mat-form-field appearance="outline">
            <mat-label>Tipo de mantenimiento</mat-label>
            <mat-select formControlName="tipo_mantenimiento">
              <mat-option value="CORRECTIVO">Correctivo</mat-option>
              <mat-option value="PREVENTIVO">Preventivo</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción de la falla</mat-label>
            <textarea matInput formControlName="detalle_falla" rows="4"
                      placeholder="Describe el problema con detalle..."></textarea>
            <mat-hint align="end">{{ form.get('detalle_falla')?.value?.length || 0 }}/500</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones adicionales (opcional)</mat-label>
            <textarea matInput formControlName="observaciones" rows="2"></textarea>
          </mat-form-field>

          <div class="form-actions full-width">
            <button mat-button type="button" routerLink="/tickets">Cancelar</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || !dispositivo() || submitting()">
              @if (submitting()) { <mat-spinner diameter="20" /> }
              @else { <ng-container><mat-icon>send</mat-icon> Enviar Ticket</ng-container> }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .dispositivo-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #E3F2FD;
      border-radius: 8px;
      border-left: 4px solid #1565C0;
      mat-icon { color: #1565C0; }
      .dispositivo-meta { font-size: 12px; color: #666; margin-top: 4px; }
    }
    .ip-warning {
      display: flex; align-items: center; gap: 8px;
      background: #FFF3E0; color: #E65100;
      padding: 10px 14px; border-radius: 6px;
      font-size: 13px;
      mat-icon { font-size: 20px; }
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
  `],
})
export class TicketCreateComponent {
  private ticketService = inject(TicketService);
  private inventarioService = inject(InventarioService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  dispositivo = signal<DispositivoList | null>(null);
  submitting = signal(false);
  ipWarning = signal(false);

  form = this.fb.group({
    busqueda: [''],
    tipo_mantenimiento: ['CORRECTIVO', Validators.required],
    detalle_falla: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    observaciones: [''],
  });

  constructor() {
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
  }

  onSubmit() {
    if (this.form.invalid || !this.dispositivo()) return;
    this.submitting.set(true);
    const payload = {
      dispositivo: this.dispositivo()!.id,
      tipo_mantenimiento: this.form.value.tipo_mantenimiento as 'CORRECTIVO' | 'PREVENTIVO',
      detalle_falla: this.form.value.detalle_falla!,
      observaciones: this.form.value.observaciones ?? '',
    };
    this.ticketService.create(payload).subscribe({
      next: (res) => {
        this.ipWarning.set(res.ip_warning ?? false);
        if (!res.ip_warning) {
          this.snackBar.open('Ticket creado exitosamente', 'OK', { duration: 3000 });
          this.router.navigate(['/tickets', res.id]);
        } else {
          this.submitting.set(false);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error al crear el ticket', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
