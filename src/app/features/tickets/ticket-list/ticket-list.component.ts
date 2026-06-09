import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { SlicePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { ToastService } from '../../../core/services/toast.service';
import { TicketList, EstadoTicket, ESTADO_COLOR } from '../../../shared/models';

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'EN_REVISION', label: 'En Revisión' },
  { value: 'ASIGNADO', label: 'Asignado' },
  { value: 'EN_ATENCION', label: 'En Atención' },
  { value: 'SOLUCIONADO', label: 'Solucionado' },
  { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento' },
  { value: 'TERCERIZADO', label: 'Tercerizado' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule, SlicePipe,
    MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatCardModule, MatProgressSpinnerModule, MatTabsModule,
  ],
  template: `
    <div class="page-header">
      <h1>Tickets</h1>
      @if (auth.esInformatica()) {
        <button mat-raised-button color="primary" routerLink="/tickets/nuevo">
          <mat-icon>add</mat-icon> Nuevo Ticket
        </button>
      }
    </div>

    <!-- Tabs: todos los roles de informática -->
    @if (verTabs()) {
      <mat-tab-group class="vista-tabs" animationDuration="180ms"
                     (selectedIndexChange)="onTabChange($event)">
        <mat-tab>
          <ng-template mat-tab-label>
            Tickets de Informática
            <span class="tab-count">{{ _todos().length }}</span>
          </ng-template>
        </mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>
            Mis tickets asignados
            @if (misTickets().length > 0) {
              <span class="tab-count tab-count-mine">{{ misTickets().length }}</span>
            }
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    }

    <!-- Filtros -->
    <div class="filters sigtic-card">
      <mat-form-field appearance="outline">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="estadoCtrl">
          @for (e of estados; track e.value) {
            <mat-option [value]="e.value">{{ e.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Tabla -->
    <div class="table-container">
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (tickets().length === 0) {
        <div class="empty-state">
          <mat-icon>confirmation_number</mat-icon>
          <p>
            @if (verTabs() && vistaTab() === 1) {
              No tienes tickets asignados con los filtros seleccionados
            } @else {
              No hay tickets con los filtros seleccionados
            }
          </p>
        </div>
      } @else {
        <table mat-table [dataSource]="tickets()">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>N°</th>
            <td mat-cell *matCellDef="let t">
              <a [routerLink]="['/tickets', t.id]" class="ticket-link">{{ t.numero }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let t">
              <span [class]="'badge badge-' + t.estado.toLowerCase()">{{ t.estado_display }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="dispositivo">
            <th mat-header-cell *matHeaderCellDef>Dispositivo</th>
            <td mat-cell *matCellDef="let t">{{ t.dispositivo_cod }}</td>
          </ng-container>

          <ng-container matColumnDef="solicitante">
            <th mat-header-cell *matHeaderCellDef>Solicitante</th>
            <td mat-cell *matCellDef="let t">{{ t.solicitante_nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="tecnico">
            <th mat-header-cell *matHeaderCellDef>Técnico</th>
            <td mat-cell *matCellDef="let t">{{ t.tecnico_nombre || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let t">{{ t.fecha_creacion | slice:0:10 }}</td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button [routerLink]="['/tickets', t.id]">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns()"></tr>
          <tr mat-row *matRowDef="let row; columns: columns();" class="clickable-row"
              [routerLink]="['/tickets', row.id]"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .vista-tabs {
      background: white;
      border: 1px solid var(--c-border, #E2E8F0);
      border-radius: 10px 10px 0 0;
      border-bottom: none;
      margin-bottom: 0;
    }
    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: #E2E8F0;
      color: #475569;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
      line-height: 1;
    }
    .tab-count-mine {
      background: #DBEAFE;
      color: #1D4ED8;
    }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 0; padding: 16px; }
    .filters mat-form-field { min-width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 40px; background: white; }
    .ticket-link { color: var(--c-primary, #2563EB); font-weight: 500; text-decoration: none; }
    .ticket-link:hover { text-decoration: underline; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: #F5F5F5; }
  `],
})
export class TicketListComponent implements OnInit {
  auth = inject(AuthService);
  private ticketService = inject(TicketService);
  private toast = inject(ToastService);

  _todos = signal<TicketList[]>([]);
  loading = signal(true);
  vistaTab = signal(0);
  estados = ESTADOS;
  estadoCtrl = new FormControl('');

  verTabs = computed(() => this.auth.esInformatica());

  misTickets = computed(() => {
    const uid = this.auth.user()?.id;
    return uid ? this._todos().filter(t => t.tecnico === uid) : [];
  });

  tickets = computed(() =>
    this.verTabs() && this.vistaTab() === 1 ? this.misTickets() : this._todos()
  );

  columns = computed(() =>
    this.auth.esInformatica()
      ? ['numero', 'estado', 'dispositivo', 'solicitante', 'tecnico', 'fecha', 'acciones']
      : ['numero', 'estado', 'dispositivo', 'fecha', 'acciones']
  );

  ngOnInit() {
    this.estadoCtrl.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe(() => this.load());
    this.load();
  }

  onTabChange(index: number) {
    this.vistaTab.set(index);
    // No new API call — misTickets is derived from _todos()
  }

  private load() {
    this.loading.set(true);
    const estado = this.estadoCtrl.value || undefined;
    this.ticketService.list({ estado }).subscribe({
      next: res => {
        this._todos.set(res.results ?? []);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar tickets.'); },
    });
  }
}
