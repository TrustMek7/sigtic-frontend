import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ToastService } from '../../core/services/toast.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { SlicePipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { UserProfile, EncargadoActivo, Rol } from '../../shared/models';

const ROLES: { value: Rol; label: string }[] = [
  { value: 'ADMIN',         label: 'Administrador' },
  { value: 'JEFE_INFO',     label: 'Jefe de Informática' },
  { value: 'ENCARGADO_INFO',label: 'Encargado de Informática' },
  { value: 'TECNICO',       label: 'Técnico' },
  { value: 'USUARIO',       label: 'Usuario' },
];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, SlicePipe, DatePipe,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
    MatPaginatorModule, MatTooltipModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1>Gestión de Usuarios</h1>
    </div>

    <!-- Estado de mando -->
    @if (auth.esJefe()) {
      <mat-card class="sigtic-card mando-card">
        <mat-card-content>
          <div class="mando-header">
            <mat-icon class="mando-icon">admin_panel_settings</mat-icon>
            <span class="mando-title">Estado de mando — Unidad de Informática</span>
          </div>

          @if (encargadoActivo()) {
            <!-- Hay delegación activa -->
            <div class="mando-row">
              <div class="mando-info">
                <div class="mando-label">Jefe de Informática</div>
                <div class="mando-nombre">{{ auth.nombreCompleto() }}
                  <span class="badge badge-gris">en pausa</span>
                </div>
              </div>
              <mat-icon class="arrow-icon">arrow_forward</mat-icon>
              <div class="mando-info">
                <div class="mando-label">Encargado activo</div>
                <div class="mando-nombre">{{ encargadoActivo()!.encargado_nombre }}
                  <span class="badge badge-finalizado">activo</span>
                </div>
                <div class="mando-meta">
                  Desde {{ encargadoActivo()!.desde | date:'dd/MM/yyyy HH:mm' }}
                  @if (encargadoActivo()!.hasta) {
                    &nbsp;·&nbsp; Hasta {{ encargadoActivo()!.hasta | date:'dd/MM/yyyy' }}
                  } @else {
                    &nbsp;·&nbsp; Sin fecha límite
                  }
                </div>
                <div class="mando-meta" style="font-style:italic">
                  "{{ encargadoActivo()!.motivo }}"
                </div>
              </div>
            </div>
            <div class="mando-actions">
              <button mat-raised-button color="primary" (click)="retomarCargo()"
                      [disabled]="submittingEnc()">
                @if (submittingEnc()) { <mat-spinner diameter="18" /> }
                @else { <ng-container><mat-icon>how_to_reg</mat-icon> Retomar cargo</ng-container> }
              </button>
            </div>

          } @else {
            <!-- Sin delegación -->
            <div class="mando-row">
              <div class="mando-info">
                <div class="mando-label">Jefe de Informática</div>
                <div class="mando-nombre">{{ auth.nombreCompleto() }}
                  <span class="badge badge-finalizado">activo</span>
                </div>
              </div>
              <div class="mando-empty">Sin delegación activa</div>
            </div>

            @if (!mostrarFormDelegacion()) {
              <div class="mando-actions">
                <button mat-stroked-button color="accent" (click)="mostrarFormDelegacion.set(true)">
                  <mat-icon>person_add</mat-icon> Delegar cargo
                </button>
              </div>
            } @else {
              <!-- Formulario de delegación -->
              <mat-divider style="margin: 16px 0" />
              <h4 style="margin:0 0 12px">Delegar cargo temporalmente</h4>
              <form [formGroup]="encForm" (ngSubmit)="onDelegar()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Delegar a</mat-label>
                  <mat-select formControlName="encargado">
                    @for (u of usuariosIT(); track u.id) {
                      <mat-option [value]="u.id">
                        {{ u.nombre_completo }}
                        <span style="color:#9E9E9E;font-size:11px"> · {{ u.rol_display }}</span>
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Hasta (opcional)</mat-label>
                  <input matInput formControlName="hasta" type="date">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Motivo</mat-label>
                  <textarea matInput formControlName="motivo" rows="2"></textarea>
                </mat-form-field>
                <div class="form-actions full-width">
                  <button mat-button type="button" (click)="mostrarFormDelegacion.set(false)">
                    Cancelar
                  </button>
                  <button mat-raised-button color="accent" type="submit"
                          [disabled]="encForm.invalid || submittingEnc()">
                    @if (submittingEnc()) { <mat-spinner diameter="18" /> }
                    @else { <ng-container><mat-icon>handshake</mat-icon> Confirmar delegación</ng-container> }
                  </button>
                </div>
              </form>
            }
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- Historial de delegaciones -->
    @if (auth.esJefe() && historialEnc().length > 0) {
      <mat-card class="sigtic-card">
        <mat-card-title>Historial de delegaciones</mat-card-title>
        <mat-card-content>
          <table mat-table [dataSource]="historialEnc()">
            <ng-container matColumnDef="encargado">
              <th mat-header-cell *matHeaderCellDef>Encargado</th>
              <td mat-cell *matCellDef="let e">{{ e.encargado_nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="desde">
              <th mat-header-cell *matHeaderCellDef>Desde</th>
              <td mat-cell *matCellDef="let e">{{ e.desde | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="hasta">
              <th mat-header-cell *matHeaderCellDef>Hasta</th>
              <td mat-cell *matCellDef="let e">{{ e.hasta ? (e.hasta | date:'dd/MM/yyyy') : '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef>Motivo</th>
              <td mat-cell *matCellDef="let e">{{ e.motivo }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let e">
                <span [class]="'badge ' + (e.activo ? 'badge-finalizado' : 'badge-gris')">
                  {{ e.activo ? 'Activo' : 'Finalizado' }}
                </span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="encCols"></tr>
            <tr mat-row *matRowDef="let row; columns: encCols;"
                [style.opacity]="row.activo ? 1 : 0.6"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    }

    <!-- Tabla de usuarios con filtros -->
    <mat-card class="sigtic-card">
      <mat-card-title>Usuarios del sistema</mat-card-title>
      <mat-card-content>
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="filter-search">
            <mat-label>Buscar nombre o DNI</mat-label>
            <input matInput [formControl]="filtroNombre" placeholder="Ej: García">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-rol">
            <mat-label>Rol</mat-label>
            <mat-select [formControl]="filtroRol">
              <mat-option value="">Todos</mat-option>
              @for (r of roles; track r.value) {
                <mat-option [value]="r.value">{{ r.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-activo">
            <mat-label>Estado</mat-label>
            <mat-select [formControl]="filtroActivo">
              <mat-option value="">Todos</mat-option>
              <mat-option value="true">Activos</mat-option>
              <mat-option value="false">Inactivos</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button matTooltip="Limpiar filtros" (click)="limpiarFiltros()">
            <mat-icon>filter_alt_off</mat-icon>
          </button>
        </div>

        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="36" /></div>
        } @else {
          <table mat-table [dataSource]="usuarios()">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let u">
                <strong>{{ u.nombre_completo }}</strong>
                <div style="font-size:11px;color:#9E9E9E">{{ u.dni }}</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="cargo">
              <th mat-header-cell *matHeaderCellDef>Cargo</th>
              <td mat-cell *matCellDef="let u">{{ u.cargo_descripcion || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Rol</th>
              <td mat-cell *matCellDef="let u">
                <span [class]="'badge ' + rolBadge(u.rol)">{{ u.rol_display }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>Activo</th>
              <td mat-cell *matCellDef="let u">
                <mat-icon [style.color]="u.activo ? '#2E7D32' : '#B71C1C'">
                  {{ u.activo ? 'check_circle' : 'cancel' }}
                </mat-icon>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                @if (auth.esJefe()) {
                  <button mat-icon-button matTooltip="Cambiar rol" (click)="editRol(u)">
                    <mat-icon>manage_accounts</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="userCols"></tr>
            <tr mat-row *matRowDef="let row; columns: userCols;"></tr>
          </table>
          <mat-paginator
            [length]="totalUsuarios()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </mat-card-content>
    </mat-card>

    <!-- Panel edición de rol -->
    @if (editando()) {
      <mat-card class="sigtic-card">
        <mat-card-title>Cambiar rol — {{ editando()!.nombre_completo }}</mat-card-title>
        <mat-card-content>
          <form [formGroup]="rolForm" (ngSubmit)="onRolSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nuevo rol</mat-label>
              <mat-select formControlName="rol">
                @for (r of roles; track r.value) {
                  <mat-option [value]="r.value">{{ r.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="form-actions full-width">
              <button mat-button type="button" (click)="editando.set(null)">Cancelar</button>
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="rolForm.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20" /> }
                @else { Guardar }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    table { width: 100%; }
    td.mat-cell { font-size: 13px; }

    .filter-bar {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
      padding: 8px 0 4px;
    }
    .filter-search { flex: 1 1 240px; }
    .filter-rol    { flex: 0 0 200px; }
    .filter-activo { flex: 0 0 130px; }

    .mando-card { border-left: 4px solid #1F4E79; }
    .mando-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .mando-icon  { color: #1F4E79; font-size: 22px; }
    .mando-title { font-weight: 600; font-size: 15px; color: #1F4E79; }
    .mando-row   { display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; margin-bottom: 12px; }
    .mando-info  { flex: 1; min-width: 180px; }
    .mando-label { font-size: 11px; text-transform: uppercase; color: #9E9E9E; letter-spacing: .5px; }
    .mando-nombre { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .mando-meta  { font-size: 12px; color: #757575; margin-top: 2px; }
    .mando-empty { flex: 1; color: #BDBDBD; font-style: italic; align-self: center; }
    .arrow-icon  { color: #BDBDBD; align-self: center; font-size: 28px; }
    .mando-actions { display: flex; gap: 8px; margin-top: 8px; }
    .badge-gris  { background: #E0E0E0 !important; color: #616161 !important; }
  `],
})
export class UsuariosComponent implements OnInit {
  readonly auth = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Tabla de usuarios
  usuarios       = signal<UserProfile[]>([]);
  loading        = signal(true);
  page           = signal(1);
  pageSize       = signal(25);
  totalUsuarios  = signal(0);
  editando       = signal<UserProfile | null>(null);
  submitting     = signal(false);

  // Estado de mando
  encargadoActivo = signal<EncargadoActivo | null>(null);
  historialEnc    = signal<EncargadoActivo[]>([]);
  usuariosIT      = signal<UserProfile[]>([]);
  mostrarFormDelegacion = signal(false);
  submittingEnc   = signal(false);

  roles    = ROLES;
  userCols = ['nombre', 'cargo', 'rol', 'activo', 'acciones'];
  encCols  = ['encargado', 'desde', 'hasta', 'motivo', 'estado'];

  filtroNombre = this.fb.control('');
  filtroRol    = this.fb.control('');
  filtroActivo = this.fb.control('true');

  rolForm = this.fb.group({ rol: ['', Validators.required] });
  encForm = this.fb.group({
    encargado: [null as number | null, Validators.required],
    hasta:     [''],
    motivo:    ['', Validators.required],
  });

  ngOnInit() {
    this.loadUsuarios();
    this.loadEstadoMando();

    this.filtroNombre.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this._resetPage());
    this.filtroRol.valueChanges.subscribe(() => this._resetPage());
    this.filtroActivo.valueChanges.subscribe(() => this._resetPage());
  }

  // ── Tabla ───────────────────────────────────────────────────────────────────

  private loadUsuarios() {
    this.loading.set(true);
    const filters: Record<string, unknown> = {
      page: this.page(),
      page_size: this.pageSize(),
    };
    const rol    = this.filtroRol.value;
    const activo = this.filtroActivo.value;
    const q      = (this.filtroNombre.value ?? '').trim();
    if (rol)    filters['rol']    = rol;
    if (activo) filters['activo'] = activo === 'true';
    if (q)      filters['q']      = q;

    this.usuarioService.list(filters).subscribe({
      next: res => {
        this.usuarios.set(res.results);
        this.totalUsuarios.set(res.count);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private _resetPage() {
    this.page.set(1);
    this.loadUsuarios();
  }

  limpiarFiltros() {
    this.filtroNombre.setValue('', { emitEvent: false });
    this.filtroRol.setValue('', { emitEvent: false });
    this.filtroActivo.setValue('true', { emitEvent: false });
    this._resetPage();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.loadUsuarios();
  }

  editRol(u: UserProfile) {
    this.editando.set(u);
    this.rolForm.patchValue({ rol: u.rol });
  }

  onRolSubmit() {
    if (this.rolForm.invalid || !this.editando()) return;
    this.submitting.set(true);
    this.usuarioService.updateRol(this.editando()!.id, this.rolForm.value.rol!).subscribe({
      next: () => {
        this.editando.set(null);
        this.submitting.set(false);
        this.toast.success('Rol actualizado.');
        this.loadUsuarios();
        // Refrescar también el select de IT por si cambió un rol
        this.usuarioService.listDelegables().subscribe(d => this.usuariosIT.set(d));
      },
      error: err => {
        this.submitting.set(false);
        this.toast.error(err?.error?.detail ?? 'Error al cambiar rol.');
      },
    });
  }

  // ── Estado de mando ─────────────────────────────────────────────────────────

  private loadEstadoMando() {
    this.usuarioService.encargadoActivo().subscribe({
      next: res => {
        this.encargadoActivo.set(res.status === 204 ? null : res.body);
      },
      error: () => this.encargadoActivo.set(null),
    });

    this.usuarioService.encargados().subscribe({
      next: lista => this.historialEnc.set(lista),
      error: () => {},
    });

    this.usuarioService.listDelegables().subscribe(d => this.usuariosIT.set(d));
  }

  onDelegar() {
    if (this.encForm.invalid) return;
    this.submittingEnc.set(true);
    const v = this.encForm.value;
    const payload: Record<string, unknown> = {
      encargado: v.encargado,
      motivo:    v.motivo,
    };
    if (v.hasta) payload['hasta'] = v.hasta;

    this.usuarioService.crearEncargado(payload).subscribe({
      next: enc => {
        this.encargadoActivo.set(enc);
        this.historialEnc.update(h => [enc, ...h]);
        this.encForm.reset();
        this.mostrarFormDelegacion.set(false);
        this.submittingEnc.set(false);
        this.toast.success('Cargo delegado correctamente.');
      },
      error: err => {
        this.submittingEnc.set(false);
        const msg = err?.error?.non_field_errors?.[0] ?? err?.error?.detail ?? 'Error al delegar';
        this.toast.error(msg);
      },
    });
  }

  retomarCargo() {
    this.submittingEnc.set(true);
    this.usuarioService.retomarCargo().subscribe({
      next: () => {
        const anterior = this.encargadoActivo();
        if (anterior) {
          this.historialEnc.update(h =>
            h.map(e => e.id === anterior.id ? { ...e, activo: false } : e)
          );
        }
        this.encargadoActivo.set(null);
        this.submittingEnc.set(false);
        this.toast.success('Cargo retomado.');
      },
      error: err => {
        this.submittingEnc.set(false);
        this.toast.error(err?.error?.detail ?? 'Error al retomar cargo.');
      },
    });
  }

  rolBadge(rol: Rol): string {
    const map: Record<Rol, string> = {
      ADMIN:          'badge-rechazado',
      JEFE_INFO:      'badge-finalizado',
      ENCARGADO_INFO: 'badge-tercerizado',
      TECNICO:        'badge-asignado',
      USUARIO:        'badge-enviado',
    };
    return map[rol] ?? '';
  }
}
