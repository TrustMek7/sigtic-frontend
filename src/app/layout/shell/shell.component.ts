import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { SlicePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, startWith } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, SlicePipe,
    MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule,
  ],
  template: `
    <div class="app-layout">

      <!-- ── Sidebar ──────────────────────────────────── -->
      <nav class="app-sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <img src="/img/Escudo-cayma.png" alt="Escudo Cayma" />
          </div>
          <div class="brand-text">
            <span class="brand-name">Gestión Interna</span>
            <span class="brand-sub">de Informática</span>
          </div>
        </div>

        <div class="sidebar-section-label">MENÚ PRINCIPAL</div>

        <mat-nav-list>
          @for (item of visibleNav; track item.route) {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active-nav-item"
               [matTooltip]="item.label"
               matTooltipPosition="right">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidebar-footer">
          <div class="user-mini">
            <div class="user-mini-avatar">{{ initials() }}</div>
            <div class="user-mini-info">
              <span class="user-mini-name">{{ auth.nombreCompleto() | slice:0:20 }}</span>
              <span class="user-mini-rol">{{ auth.rol() }}</span>
            </div>
          </div>
        </div>
      </nav>

      <!-- ── Área principal ─────────────────────────── -->
      <div class="app-main">
        <mat-toolbar class="app-toolbar">
          <!-- Breadcrumb -->
          <div class="toolbar-breadcrumb">
            <span class="bc-root">Sistema</span>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span class="bc-current">{{ pageTitle() }}</span>
          </div>

          <span class="toolbar-spacer"></span>

          <!-- Notificaciones -->
          <button mat-icon-button class="toolbar-action" matTooltip="Notificaciones">
            <mat-icon>notifications_none</mat-icon>
          </button>

          <!-- Avatar / menú de usuario -->
          <button class="toolbar-avatar" [matMenuTriggerFor]="userMenu">
            {{ initials() }}
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="user-menu-header">
              <strong>{{ auth.nombreCompleto() }}</strong>
              <span>{{ auth.rol() }}</span>
            </div>
            <mat-divider />
            <button mat-menu-item (click)="onLogout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="app-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Brand ─────────────────────────────────────── */
    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 14px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .brand-logo {
      width: 38px; height: 38px; border-radius: 50%;
      overflow: hidden; flex-shrink: 0;
      background: white; padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      img { width: 100%; height: 100%; object-fit: contain; }
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.25; }
    .brand-name { font-size: 12px; font-weight: 700; color: white; }
    .brand-sub  { font-size: 10px; color: rgba(255,255,255,.45); }

    /* ── Section label ─────────────────────────────── */
    .sidebar-section-label {
      font-size: 10px; font-weight: 700;
      color: rgba(255,255,255,.28);
      letter-spacing: 1.1px;
      padding: 18px 16px 6px;
    }

    /* ── Nav items ──────────────────────────────────── */
    mat-nav-list { padding: 4px 8px; flex: 1; }

    a[mat-list-item] {
      color: #94A3B8 !important;
      border-radius: 8px !important;
      margin-bottom: 2px !important;
      transition: background 120ms ease, color 120ms ease !important;
      --mdc-list-list-item-label-text-color: #94A3B8;
      --mdc-list-list-item-leading-icon-color: #94A3B8;
    }
    a[mat-list-item]:hover {
      background: rgba(255,255,255,.07) !important;
      --mdc-list-list-item-label-text-color: #FFFFFF;
      --mdc-list-list-item-leading-icon-color: #FFFFFF;
    }
    .active-nav-item {
      background: rgba(37,99,235,.2) !important;
      --mdc-list-list-item-label-text-color: #93C5FD !important;
      --mdc-list-list-item-leading-icon-color: #93C5FD !important;
    }

    /* ── Sidebar footer ──────────────────────────── */
    .sidebar-footer {
      margin-top: auto;
      padding: 10px 8px 14px;
      border-top: 1px solid rgba(255,255,255,.06);
    }
    .user-mini {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
    }
    .user-mini-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #2563EB, #06B6D4);
      color: white; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .user-mini-info { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .user-mini-name {
      font-size: 12px; color: rgba(255,255,255,.9); font-weight: 500;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .user-mini-rol { font-size: 10px; color: rgba(255,255,255,.38); }

    /* ── Topbar ─────────────────────────────────────── */
    .toolbar-breadcrumb {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px;
    }
    .bc-root    { color: #94A3B8; }
    .bc-sep     { font-size: 16px; color: #CBD5E1; line-height: 1; }
    .bc-current { color: #0F172A; font-weight: 600; }

    .toolbar-spacer { flex: 1; }

    .toolbar-action {
      color: #64748B !important;
      &:hover { color: #0F172A !important; background: #F1F5F9 !important; }
    }

    .toolbar-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #2563EB, #06B6D4);
      color: white; font-size: 12px; font-weight: 700;
      border: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: opacity .15s, transform .15s;
      font-family: inherit;
      margin-left: 6px;
      &:hover { opacity: .88; transform: scale(1.06); }
    }

    /* ── User menu header ────────────────────────── */
    .user-menu-header {
      padding: 12px 16px 8px;
      display: flex; flex-direction: column; gap: 2px;
      pointer-events: none;
      strong { font-size: 13px; color: #0F172A; font-weight: 600; }
      span   { font-size: 11px; color: #64748B; }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  private readonly allNav: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',          route: '/dashboard' },
    { label: 'Tickets',    icon: 'confirmation_number', route: '/tickets' },
    { label: 'Inventario', icon: 'devices',             route: '/inventario', roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Almacén',    icon: 'inventory',           route: '/almacen',    roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Bajas',      icon: 'delete_forever',      route: '/bajas',      roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Usuarios',   icon: 'manage_accounts',     route: '/usuarios',   roles: ['ADMIN', 'JEFE_INFO'] },
  ];

  private _routeChange = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
    )
  );

  pageTitle = computed(() => {
    this._routeChange();
    const url = this.router.url.split('?')[0];
    return this.allNav.find(n => url === n.route || url.startsWith(n.route + '/'))?.label ?? 'Panel';
  });

  initials = computed(() => {
    const parts = this.auth.nombreCompleto().trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (this.auth.nombreCompleto().slice(0, 2) || 'U').toUpperCase();
  });

  get visibleNav(): NavItem[] {
    const rol = this.auth.rol();
    return this.allNav.filter(item => !item.roles || (rol && item.roles.includes(rol)));
  }

  onLogout() {
    this.auth.logout().subscribe();
  }
}
