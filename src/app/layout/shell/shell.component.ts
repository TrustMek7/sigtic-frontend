import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
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
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule,
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <nav class="app-sidebar">
        <div class="sidebar-brand">
          <mat-icon>computer</mat-icon>
          <span>SIGTIC</span>
        </div>
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
      </nav>

      <!-- Main area -->
      <div class="app-main">
        <mat-toolbar class="app-toolbar" color="primary">
          <span class="toolbar-spacer"></span>
          <span class="toolbar-user">{{ auth.nombreCompleto() }}</span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
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
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid rgba(255,255,255,.15);
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    mat-nav-list { padding-top: 8px; }
    a[mat-list-item] { color: rgba(255,255,255,.85); border-radius: 0 24px 24px 0; margin-right: 8px; }
    a[mat-list-item]:hover { background: rgba(255,255,255,.1); color: white; }
    .active-nav-item { background: rgba(255,255,255,.2) !important; color: white !important; font-weight: 500; }
    .toolbar-spacer { flex: 1; }
    .toolbar-user { font-size: 14px; margin-right: 8px; opacity: .9; }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);

  private allNav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Tickets', icon: 'confirmation_number', route: '/tickets' },
    { label: 'Inventario', icon: 'devices', route: '/inventario', roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Almacén', icon: 'inventory', route: '/almacen', roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Bajas', icon: 'delete_forever', route: '/bajas', roles: ['ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'] },
    { label: 'Usuarios', icon: 'manage_accounts', route: '/usuarios', roles: ['ADMIN', 'JEFE_INFO'] },
  ];

  get visibleNav(): NavItem[] {
    const rol = this.auth.rol();
    return this.allNav.filter(item => !item.roles || (rol && item.roles.includes(rol)));
  }

  onLogout() {
    this.auth.logout().subscribe();
  }
}
