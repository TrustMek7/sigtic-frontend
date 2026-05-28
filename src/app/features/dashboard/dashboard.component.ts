import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { TicketList, EstadoTicket } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlicePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="page-header">
      <h1>Bienvenido, {{ auth.nombreCompleto() }}</h1>
      @if (auth.esInformatica()) {
        <button mat-raised-button color="primary" routerLink="/tickets/nuevo">
          <mat-icon>add</mat-icon> Nuevo Ticket
        </button>
      }
    </div>

    <!-- Métricas rápidas -->
    @if (auth.esInformatica()) {
      <div class="dashboard-metrics">
        @for (m of metrics(); track m.label) {
          <mat-card class="metric-card" [routerLink]="['/tickets']" [queryParams]="{estado: m.estado}">
            <mat-card-content>
              <div class="metric-icon" [style.background]="m.color">
                <mat-icon>{{ m.icon }}</mat-icon>
              </div>
              <div class="metric-data">
                <span class="metric-count">{{ m.count }}</span>
                <span class="metric-label">{{ m.label }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }

    <!-- Tickets recientes -->
    <mat-card class="sigtic-card">
      <mat-card-header>
        <mat-card-title>
          {{ auth.esInformatica() ? 'Tickets pendientes' : 'Mis tickets recientes' }}
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (tickets().length === 0) {
          <div class="empty-state">
            <mat-icon>confirmation_number</mat-icon>
            <p>No hay tickets activos</p>
          </div>
        } @else {
          @for (t of tickets(); track t.id) {
            <div class="ticket-row" [routerLink]="['/tickets', t.id]">
              <div class="ticket-info">
                <strong>{{ t.numero }}</strong>
                <span class="ticket-device">{{ t.dispositivo_cod }}</span>
                <span [class]="'badge badge-' + t.estado.toLowerCase()">{{ t.estado_display }}</span>
              </div>
              <div class="ticket-meta">
                <span>{{ t.fecha_creacion | slice:0:10 }}</span>
                @if (t.tecnico_nombre) {
                  <span>{{ t.tecnico_nombre }}</span>
                }
              </div>
            </div>
          }
        }
        <div class="card-footer-link">
          <a mat-button color="primary" routerLink="/tickets">Ver todos los tickets →</a>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .dashboard-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      cursor: pointer;
      transition: transform .15s, box-shadow .15s;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
      mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    }
    .metric-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: white; }
    }
    .metric-count { font-size: 28px; font-weight: 700; display: block; line-height: 1; }
    .metric-label { font-size: 12px; color: #666; }
    .ticket-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #F0F0F0;
      cursor: pointer;
      border-radius: 4px;
      &:hover { background: #F5F5F5; }
      &:last-child { border-bottom: none; }
    }
    .ticket-info { display: flex; align-items: center; gap: 10px; }
    .ticket-device { color: #666; font-size: 13px; }
    .ticket-meta { font-size: 12px; color: #9E9E9E; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .card-footer-link { text-align: right; padding-top: 8px; }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private ticketService = inject(TicketService);

  tickets = signal<TicketList[]>([]);
  metrics = signal<Array<{ label: string; count: number; icon: string; color: string; estado: string }>>([]);

  ngOnInit() {
    this.ticketService.list().subscribe(res => {
      this.tickets.set(res.results?.slice(0, 10) ?? []);
      this.buildMetrics(res.results ?? []);
    });
  }

  private buildMetrics(tickets: TicketList[]) {
    const count = (estado: EstadoTicket) => tickets.filter(t => t.estado === estado).length;
    this.metrics.set([
      { label: 'Enviados', count: count('ENVIADO'), icon: 'send', color: '#1565C0', estado: 'ENVIADO' },
      { label: 'En Atención', count: count('EN_ATENCION'), icon: 'engineering', color: '#6A1B9A', estado: 'EN_ATENCION' },
      { label: 'En Mantenimiento', count: count('EN_MANTENIMIENTO'), icon: 'build', color: '#F57F17', estado: 'EN_MANTENIMIENTO' },
      { label: 'Tercerizados', count: count('TERCERIZADO'), icon: 'business', color: '#006064', estado: 'TERCERIZADO' },
    ]);
  }
}
