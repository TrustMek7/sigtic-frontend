import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SlicePipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { TicketList, EstadoTicket } from '../../shared/models';

interface Metric {
  label: string;
  count: number;
  icon: string;
  bgColor: string;
  iconColor: string;
  estado: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SlicePipe, DatePipe, MatButtonModule, MatIconModule],
  template: `
    <!-- Header de bienvenida -->
    <div class="page-header">
      <div class="welcome-block">
        <h1>Bienvenido, {{ firstName() }}</h1>
        <p class="welcome-sub">Panel de gestión · Unidad de Informática y Sistemas</p>
      </div>
      @if (auth.esInformatica()) {
        <button mat-flat-button class="btn-new-ticket" routerLink="/tickets/nuevo">
          <mat-icon>add</mat-icon> Nuevo Ticket
        </button>
      }
    </div>

    <!-- KPI Cards -->
    @if (auth.esInformatica()) {
      <div class="metrics-grid">
        @for (m of metrics(); track m.label) {
          <div class="metric-card" [routerLink]="['/tickets']" [queryParams]="{estado: m.estado}">
            <div class="metric-icon-wrap" [style.background]="m.bgColor">
              <mat-icon [style.color]="m.iconColor">{{ m.icon }}</mat-icon>
            </div>
            <div class="metric-body">
              <span class="metric-count">{{ m.count }}</span>
              <span class="metric-label">{{ m.label }}</span>
            </div>
            <mat-icon class="metric-arrow">arrow_forward</mat-icon>
          </div>
        }
      </div>
    }

    <!-- Tabla de tickets -->
    <div class="tickets-card">
      <div class="tickets-header">
        <div>
          <h2 class="tickets-title">
            {{ auth.esInformatica() ? 'Tickets pendientes' : 'Mis tickets recientes' }}
          </h2>
          <p class="tickets-sub">Últimos registros del sistema</p>
        </div>
        <a mat-button class="btn-ver-todos" routerLink="/tickets">
          Ver todos <mat-icon>arrow_forward</mat-icon>
        </a>
      </div>

      @if (tickets().length === 0) {
        <div class="empty-state" style="padding:48px 20px">
          <mat-icon>confirmation_number</mat-icon>
          <p>No hay tickets activos</p>
        </div>
      } @else {
        <div class="tickets-table">
          <!-- Encabezado -->
          <div class="ticket-thead">
            <span class="col-num">N°</span>
            <span class="col-device">Dispositivo</span>
            <span class="col-status">Estado</span>
            <span class="col-date">Fecha</span>
            <span class="col-tech">Técnico</span>
          </div>
          <!-- Filas -->
          @for (t of tickets(); track t.id) {
            <div class="ticket-row" [routerLink]="['/tickets', t.id]">
              <span class="col-num ticket-num">{{ t.numero }}</span>
              <span class="col-device ticket-device">{{ t.dispositivo_cod }}</span>
              <span class="col-status">
                <span [class]="'badge badge-' + t.estado.toLowerCase()">
                  {{ t.estado_display }}
                </span>
              </span>
              <span class="col-date ticket-date">{{ t.fecha_creacion | slice:0:10 }}</span>
              <span class="col-tech ticket-tech">{{ t.tecnico_nombre || '—' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    /* Welcome */
    .welcome-block h1 { margin: 0 0 2px; }
    .welcome-sub { margin: 0; font-size: 13px; color: var(--c-text-muted, #64748B); }

    /* Nuevo ticket button */
    .btn-new-ticket {
      background: var(--c-primary, #2563EB) !important;
      color: white !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      box-shadow: 0 2px 10px rgba(37,99,235,.3) !important;
      transition: opacity .15s, transform .15s !important;
      &:hover { opacity: .9; transform: translateY(-1px); }
    }

    /* ── KPI grid ─────────────────────────────────── */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(15,23,42,.06);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s;
      position: relative;
      overflow: hidden;
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(15,23,42,.10);
        border-color: #CBD5E1;
      }
    }

    .metric-icon-wrap {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }

    .metric-body {
      display: flex; flex-direction: column;
      flex: 1;
    }
    .metric-count {
      font-size: 30px; font-weight: 700;
      line-height: 1; color: #0F172A;
      letter-spacing: -.04em;
    }
    .metric-label {
      font-size: 12px; color: #64748B;
      margin-top: 3px; font-weight: 500;
    }
    .metric-arrow {
      font-size: 16px; color: #CBD5E1;
      transition: color .15s;
    }
    .metric-card:hover .metric-arrow { color: #94A3B8; }

    /* ── Tickets card ─────────────────────────────── */
    .tickets-card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(15,23,42,.06);
      overflow: hidden;
    }

    .tickets-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #F1F5F9;
    }
    .tickets-title { margin: 0 0 2px; font-size: 15px; font-weight: 600; color: #0F172A; }
    .tickets-sub   { margin: 0; font-size: 12px; color: #94A3B8; }
    .btn-ver-todos {
      color: #2563EB !important;
      font-size: 13px; font-weight: 500;
      display: flex; align-items: center; gap: 4px;
      mat-icon { font-size: 16px; }
    }

    /* Tabla de tickets */
    .tickets-table { width: 100%; }

    .ticket-thead {
      display: grid;
      grid-template-columns: 100px 1fr 140px 100px 160px;
      padding: 8px 24px;
      background: #FAFBFC;
      border-bottom: 1px solid #F1F5F9;
      font-size: 11px; font-weight: 600;
      color: #94A3B8; text-transform: uppercase; letter-spacing: .6px;
    }

    .ticket-row {
      display: grid;
      grid-template-columns: 100px 1fr 140px 100px 160px;
      padding: 13px 24px;
      border-bottom: 1px solid #F8FAFC;
      cursor: pointer;
      transition: background 100ms ease;
      align-items: center;
      &:hover { background: #F8FAFD; }
      &:last-child { border-bottom: none; }
    }

    .ticket-num    { font-size: 13px; font-weight: 600; color: #2563EB; }
    .ticket-device { font-size: 13px; color: #0F172A; }
    .ticket-date   { font-size: 12px; color: #94A3B8; }
    .ticket-tech   { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private ticketService = inject(TicketService);

  tickets = signal<TicketList[]>([]);
  metrics = signal<Metric[]>([]);

  firstName = computed(() => {
    const parts = this.auth.nombreCompleto().trim().split(/\s+/);
    return parts[0] || this.auth.nombreCompleto();
  });

  ngOnInit() {
    this.ticketService.list().subscribe(res => {
      const all = res.results ?? [];
      this.tickets.set(all.slice(0, 10));
      this.buildMetrics(all);
    });
  }

  private buildMetrics(tickets: TicketList[]) {
    const count = (estado: EstadoTicket) => tickets.filter(t => t.estado === estado).length;
    this.metrics.set([
      {
        label: 'Enviados', icon: 'send',
        count: count('ENVIADO'), estado: 'ENVIADO',
        bgColor: '#DBEAFE', iconColor: '#2563EB',
      },
      {
        label: 'En Atención', icon: 'engineering',
        count: count('EN_ATENCION'), estado: 'EN_ATENCION',
        bgColor: '#EDE9FE', iconColor: '#7C3AED',
      },
      {
        label: 'Mantenimiento', icon: 'build',
        count: count('EN_MANTENIMIENTO'), estado: 'EN_MANTENIMIENTO',
        bgColor: '#FFEDD5', iconColor: '#C2410C',
      },
      {
        label: 'Tercerizados', icon: 'business_center',
        count: count('TERCERIZADO'), estado: 'TERCERIZADO',
        bgColor: '#CFFAFE', iconColor: '#0E7490',
      },
    ]);
  }
}
