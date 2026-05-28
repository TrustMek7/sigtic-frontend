import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SlicePipe } from '@angular/common';
import { UsuarioService } from '../../core/services/usuario.service';
import { UserProfile, EncargadoActivo, Rol } from '../../shared/models';

const ROLES: { value: Rol; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'JEFE_INFO', label: 'Jefe de Informática' },
  { value: 'ENCARGADO_INFO', label: 'Encargado de Informática' },
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'USUARIO', label: 'Usuario' },
];

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, SlicePipe,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Gestión de Usuarios</h1>
    </div>

    <!-- Usuarios del sistema -->
    <mat-card class="sigtic-card">
      <mat-card-title>Usuarios del sistema</mat-card-title>
      <mat-card-content>
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

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Rol</th>
              <td mat-cell *matCellDef="let u">
                <span [class]="'badge ' + rolBadge(u.rol)">{{ u.rol_display }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="cargo">
              <th mat-header-cell *matHeaderCellDef>Cargo</th>
              <td mat-cell *matCellDef="let u">{{ u.cargo_descripcion || '—' }}</td>
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
                <button mat-icon-button (click)="editRol(u)" matTooltip="Cambiar rol">
                  <mat-icon>manage_accounts</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="userCols"></tr>
            <tr mat-row *matRowDef="let row; columns: userCols;"></tr>
          </table>
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
              <button mat-raised-button color="primary" type="submit" [disabled]="rolForm.invalid || submitting()">
                @if (submitting()) { <mat-spinner diameter="20" /> }
                @else { Guardar }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <!-- Encargados activos -->
    <mat-card class="sigtic-card">
      <mat-card-title>Encargados Temporales</mat-card-title>
      <mat-card-content>
        @if (loadingEnc()) {
          <div class="loading-center"><mat-spinner diameter="36" /></div>
        } @else {
          @if (encargados().length > 0) {
            <table mat-table [dataSource]="encargados()" style="margin-bottom:16px">
              <ng-container matColumnDef="encargado">
                <th mat-header-cell *matHeaderCellDef>Encargado</th>
                <td mat-cell *matCellDef="let e">{{ e.encargado_nombre }}</td>
              </ng-container>
              <ng-container matColumnDef="desde">
                <th mat-header-cell *matHeaderCellDef>Desde</th>
                <td mat-cell *matCellDef="let e">{{ e.desde | slice:0:10 }}</td>
              </ng-container>
              <ng-container matColumnDef="hasta">
                <th mat-header-cell *matHeaderCellDef>Hasta</th>
                <td mat-cell *matCellDef="let e">{{ e.hasta ? (e.hasta | slice:0:10) : '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="motivo">
                <th mat-header-cell *matHeaderCellDef>Motivo</th>
                <td mat-cell *matCellDef="let e">{{ e.motivo }}</td>
              </ng-container>
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let e">
                  @if (e.activo) {
                    <button mat-icon-button color="warn" (click)="desactivarEncargado(e)" matTooltip="Desactivar">
                      <mat-icon>person_remove</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="encCols"></tr>
              <tr mat-row *matRowDef="let row; columns: encCols;"
                  [style.opacity]="row.activo ? 1 : 0.5"></tr>
            </table>
          }

          <!-- Nuevo encargado -->
          <mat-divider style="margin-bottom:16px" />
          <h4>Asignar nuevo encargado temporal</h4>
          <form [formGroup]="encForm" (ngSubmit)="onEncSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Encargado</mat-label>
              <mat-select formControlName="encargado">
                @for (u of usuariosInfo(); track u.id) {
                  <mat-option [value]="u.id">{{ u.nombre_completo }}</mat-option>
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
              <button mat-raised-button color="accent" type="submit"
                      [disabled]="encForm.invalid || submittingEnc()">
                @if (submittingEnc()) { <mat-spinner diameter="20" /> }
                @else { <ng-container><mat-icon>person_add</mat-icon> Asignar Encargado</ng-container> }
              </button>
            </div>
          </form>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 24px; }
    table { width: 100%; }
    td.mat-cell { font-size: 13px; }
  `],
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  usuarios = signal<UserProfile[]>([]);
  usuariosInfo = signal<UserProfile[]>([]);
  encargados = signal<EncargadoActivo[]>([]);
  loading = signal(true);
  loadingEnc = signal(true);
  submitting = signal(false);
  submittingEnc = signal(false);
  editando = signal<UserProfile | null>(null);

  roles = ROLES;
  userCols = ['nombre', 'email', 'rol', 'cargo', 'activo', 'acciones'];
  encCols = ['encargado', 'desde', 'hasta', 'motivo', 'acciones'];

  rolForm = this.fb.group({ rol: ['', Validators.required] });
  encForm = this.fb.group({
    encargado: [null as number | null, Validators.required],
    hasta: [''],
    motivo: ['', Validators.required],
  });

  ngOnInit() {
    this.loadUsuarios();
    this.loadEncargados();
  }

  private loadUsuarios() {
    this.usuarioService.list().subscribe({
      next: users => {
        this.usuarios.set(users);
        this.usuariosInfo.set(users.filter(u => ['JEFE_INFO', 'ENCARGADO_INFO', 'TECNICO'].includes(u.rol)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadEncargados() {
    this.usuarioService.encargados().subscribe({
      next: enc => { this.encargados.set(enc); this.loadingEnc.set(false); },
      error: () => this.loadingEnc.set(false),
    });
  }

  editRol(u: UserProfile) {
    this.editando.set(u);
    this.rolForm.patchValue({ rol: u.rol });
  }

  onRolSubmit() {
    if (this.rolForm.invalid || !this.editando()) return;
    this.submitting.set(true);
    this.usuarioService.updateRol(this.editando()!.id, this.rolForm.value.rol!).subscribe({
      next: updated => {
        this.usuarios.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.editando.set(null);
        this.submitting.set(false);
        this.snackBar.open('Rol actualizado', 'OK', { duration: 2500 });
      },
      error: err => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 });
      },
    });
  }

  onEncSubmit() {
    if (this.encForm.invalid) return;
    this.submittingEnc.set(true);
    const v = this.encForm.value;
    const payload: Record<string, unknown> = { encargado: v.encargado, motivo: v.motivo };
    if (v.hasta) payload['hasta'] = v.hasta;
    this.usuarioService.crearEncargado(payload).subscribe({
      next: () => {
        this.snackBar.open('Encargado asignado', 'OK', { duration: 2500 });
        this.encForm.reset();
        this.submittingEnc.set(false);
        this.loadingEnc.set(true);
        this.loadEncargados();
      },
      error: err => {
        this.submittingEnc.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 });
      },
    });
  }

  desactivarEncargado(e: EncargadoActivo) {
    this.usuarioService.desactivarEncargado(e.id).subscribe({
      next: () => {
        this.snackBar.open('Encargado desactivado', 'OK', { duration: 2500 });
        this.loadingEnc.set(true);
        this.loadEncargados();
      },
      error: err => this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  rolBadge(rol: Rol): string {
    const map: Record<Rol, string> = {
      ADMIN: 'badge-rechazado',
      JEFE_INFO: 'badge-finalizado',
      ENCARGADO_INFO: 'badge-tercerizado',
      TECNICO: 'badge-asignado',
      USUARIO: 'badge-enviado',
    };
    return map[rol] ?? '';
  }
}
