import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      // Tickets
      {
        path: 'tickets',
        loadComponent: () => import('./features/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
      },
      {
        path: 'tickets/nuevo',
        loadComponent: () => import('./features/tickets/ticket-create/ticket-create.component').then(m => m.TicketCreateComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/tickets/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
      },
      // Inventario (solo IT)
      {
        path: 'inventario',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/inventario/inventario-list/inventario-list.component').then(m => m.InventarioListComponent),
      },
      {
        path: 'inventario/nuevo',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/inventario/inventario-form/inventario-form.component').then(m => m.InventarioFormComponent),
      },
      {
        path: 'inventario/:id',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/inventario/inventario-detail/inventario-detail.component').then(m => m.InventarioDetailComponent),
      },
      {
        path: 'inventario/:id/editar',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/inventario/inventario-form/inventario-form.component').then(m => m.InventarioFormComponent),
      },
      // Almacén (solo IT)
      {
        path: 'almacen',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/almacen/almacen.component').then(m => m.AlmacenComponent),
      },
      // Bajas
      {
        path: 'bajas',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO')],
        loadComponent: () => import('./features/bajas/bajas.component').then(m => m.BajasComponent),
      },
      // Usuarios (solo JEFE/ADMIN)
      {
        path: 'usuarios',
        canActivate: [roleGuard('ADMIN', 'JEFE_INFO')],
        loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
