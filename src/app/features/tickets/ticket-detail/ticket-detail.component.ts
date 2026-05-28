import { Component, inject, OnInit, signal, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { TicketDetail, UserProfile, EstadoTicket, ESTADOS_TERMINALES } from '../../../shared/models';
import { SlicePipe } from '@angular/common';
import { TransicionDialogComponent } from '../transicion-dialog/transicion-dialog.component';
import { ReplacePipe } from '../../../shared/pipes/replace.pipe';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule,
    SlicePipe, ReplacePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatChipsModule, MatDialogModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-center"><mat-spinner /></div>
    } @else if (ticket()) {
      <div class="page-header">
        <h1>Ticket {{ ticket()!.numero }}</h1>
        <div class="header-actions">
          <span [class]="'badge badge-' + ticket()!.estado.toLowerCase()">{{ ticket()!.estado_display }}</span>
          @if (!esTerminal() && auth.esInformatica()) {
            <button mat-raised-button color="accent" (click)="openTransicion()">
              <mat-icon>swap_horiz</mat-icon> Cambiar Estado
            </button>
          }
          @if (esTerminal() && auth.esJefeOEncargado()) {
            <button mat-raised-button color="primary" (click)="generarDocumento()">
              <mat-icon>picture_as_pdf</mat-icon> Generar PDF
            </button>
          }
          <button mat-button routerLink="/tickets"><mat-icon>arrow_back</mat-icon></button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Info principal -->
        <mat-card class="sigtic-card">
          <mat-card-title>Información del Ticket</mat-card-title>
          <mat-card-content>
            <dl class="info-list">
              <dt>Dispositivo</dt><dd>{{ ticket()!.dispositivo_cod }} — {{ ticket()!.dispositivo_tipo }}</dd>
              <dt>Tipo</dt><dd>{{ ticket()!.tipo_mantenimiento }}</dd>
              <dt>Solicitante</dt><dd>{{ ticket()!.solicitante_nombre }}</dd>
              <dt>Responsable (snapshot)</dt>
              <dd>{{ ticket()!.nombre_responsable_snapshot || '—' }}<br>
                <small>{{ ticket()!.cargo_responsable_snapshot }}</small></dd>
              @if (ticket()!.tecnico_nombre) {
                <dt>Técnico</dt><dd>{{ ticket()!.tecnico_nombre }}</dd>
              }
              <dt>Fecha creación</dt><dd>{{ ticket()!.fecha_creacion | slice:0:16 | replace:'T':' ' }}</dd>
              @if (ticket()!.fecha_cierre) {
                <dt>Fecha cierre</dt><dd>{{ ticket()!.fecha_cierre | slice:0:16 | replace:'T':' ' }}</dd>
              }
            </dl>
            <mat-divider class="my-12" />
            <h4>Descripción de la falla</h4>
            <p>{{ ticket()!.detalle_falla }}</p>
          </mat-card-content>
        </mat-card>

        <!-- Diagnóstico -->
        @if (ticket()!.diagnostico) {
          <mat-card class="sigtic-card">
            <mat-card-title>Diagnóstico Técnico</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Tipo de falla</dt><dd>{{ ticket()!.diagnostico!.tipo_falla }}</dd>
                <dt>Resultado</dt>
                <dd><span class="badge badge-asignado">{{ ticket()!.diagnostico!.tipo_resultado }}</span></dd>
                @if (ticket()!.diagnostico!.tiempo_estimado) {
                  <dt>Tiempo estimado</dt><dd>{{ ticket()!.diagnostico!.tiempo_estimado }}</dd>
                }
                <dt>Técnico</dt><dd>{{ ticket()!.diagnostico!.tecnico_nombre }}</dd>
              </dl>
              <h4>Detalle técnico</h4>
              <p>{{ ticket()!.diagnostico!.detalle_tecnico }}</p>
            </mat-card-content>
          </mat-card>
        }

        <!-- Formulario diagnóstico (si es técnico y estado EN_ATENCION) -->
        @if (puedeRegistrarDiagnostico()) {
          <mat-card class="sigtic-card">
            <mat-card-title>Registrar Diagnóstico</mat-card-title>
            <mat-card-content>
              <form [formGroup]="diagForm" (ngSubmit)="onDiagnostico()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de resultado</mat-label>
                  <mat-select formControlName="tipo_resultado">
                    <mat-option value="MENOR">MENOR — Solución inmediata</mat-option>
                    <mat-option value="MAYOR">MAYOR — Requiere mantenimiento</mat-option>
                    <mat-option value="TERCERIZADO">TERCERIZADO — Empresa externa</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de falla</mat-label>
                  <input matInput formControlName="tipo_falla">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Detalle técnico</mat-label>
                  <textarea matInput formControlName="detalle_tecnico" rows="3"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tiempo estimado (opcional)</mat-label>
                  <input matInput formControlName="tiempo_estimado" placeholder="Ej: 2 días">
                </mat-form-field>
                <div class="form-actions full-width">
                  <button mat-raised-button color="primary" type="submit" [disabled]="diagForm.invalid">
                    <mat-icon>save</mat-icon> Guardar Diagnóstico
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Historial -->
        <mat-card class="sigtic-card">
          <mat-card-title>Historial de Estados</mat-card-title>
          <mat-card-content>
            <div class="timeline">
              @for (h of ticket()!.historial; track h.id) {
                <div class="timeline-item">
                  <div class="timeline-date">{{ h.fecha | slice:0:16 | replace:'T':' ' }} — {{ h.usuario_nombre }}</div>
                  <div class="timeline-title">
                    @if (h.estado_anterior) { {{ h.estado_anterior_display }} → }
                    {{ h.estado_nuevo_display }}
                  </div>
                  @if (h.comentario) {
                    <div class="timeline-body">{{ h.comentario }}</div>
                  }
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
    .info-list { display: grid; grid-template-columns: 160px 1fr; gap: 6px 16px; }
    dt { font-weight: 500; color: #666; font-size: 13px; }
    dd { margin: 0; font-size: 14px; }
    .my-12 { margin: 12px 0; }
    h4 { font-size: 14px; font-weight: 500; margin: 12px 0 6px; color: #555; }
    .form-actions { display: flex; justify-content: flex-end; }
  `],
})
export class TicketDetailComponent implements OnInit {
  @Input() id!: string;
  auth = inject(AuthService);
  private ticketService = inject(TicketService);
  private usuarioService = inject(UsuarioService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  ticket = signal<TicketDetail | null>(null);
  loading = signal(true);
  tecnicos = signal<UserProfile[]>([]);

  diagForm = this.fb.group({
    tipo_resultado: ['MENOR', Validators.required],
    tipo_falla: ['', Validators.required],
    detalle_tecnico: ['', Validators.required],
    tiempo_estimado: [''],
  });

  get esTerminal() {
    return () => {
      const t = this.ticket();
      return t ? ESTADOS_TERMINALES.includes(t.estado) : false;
    };
  }

  puedeRegistrarDiagnostico() {
    const t = this.ticket();
    if (!t || t.diagnostico) return false;
    return t.estado === 'EN_ATENCION' && this.auth.hasRole('TECNICO', 'JEFE_INFO', 'ADMIN', 'ENCARGADO_INFO');
  }

  ngOnInit() {
    this.load();
    if (this.auth.esInformatica()) {
      this.usuarioService.listTecnicos().subscribe(t => this.tecnicos.set(t));
    }
  }

  load() {
    this.loading.set(true);
    this.ticketService.get(+this.id).subscribe({
      next: t => { this.ticket.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openTransicion() {
    const ref = this.dialog.open(TransicionDialogComponent, {
      width: '460px',
      data: { ticket: this.ticket(), tecnicos: this.tecnicos() },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.ticketService.transicion(this.ticket()!.id, result).subscribe({
          next: t => { this.ticket.set(t); this.snackBar.open('Estado actualizado', 'OK', { duration: 2500 }); },
          error: err => this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 }),
        });
      }
    });
  }

  onDiagnostico() {
    if (this.diagForm.invalid) return;
    this.ticketService.diagnostico(this.ticket()!.id, this.diagForm.value as any).subscribe({
      next: () => { this.snackBar.open('Diagnóstico registrado', 'OK', { duration: 2500 }); this.load(); },
      error: err => this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }

  generarDocumento() {
    this.ticketService.generarDocumento(this.ticket()!.id).subscribe({
      next: res => {
        this.snackBar.open('Documento generado', 'Descargar', { duration: 5000 })
          .onAction().subscribe(() => window.open(res.url, '_blank'));
      },
      error: err => this.snackBar.open(err?.error?.detail ?? 'Error', 'Cerrar', { duration: 4000 }),
    });
  }
}
