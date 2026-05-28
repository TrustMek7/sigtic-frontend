import { Component, inject, OnInit, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { DispositivoDetail } from '../../../shared/models';

@Component({
  selector: 'app-inventario-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, SlicePipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-center"><mat-spinner /></div>
    } @else if (disp()) {
      <div class="page-header">
        <h1>{{ disp()!.cod_inventario }}</h1>
        <div style="display:flex;gap:8px;align-items:center">
          <span [class]="'badge ' + estadoBadge(disp()!.estado)">{{ disp()!.estado }}</span>
          @if (auth.esInformatica()) {
            <button mat-raised-button color="primary"
                    [routerLink]="['/inventario', disp()!.id, 'editar']">
              <mat-icon>edit</mat-icon> Editar
            </button>
          }
          <button mat-button routerLink="/inventario"><mat-icon>arrow_back</mat-icon></button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Info base -->
        <mat-card class="sigtic-card">
          <mat-card-title>Información General</mat-card-title>
          <mat-card-content>
            <dl class="info-list">
              <dt>Tipo</dt><dd>{{ disp()!.tipo_nombre }}</dd>
              <dt>Código</dt><dd>{{ disp()!.cod_inventario }}</dd>
              <dt>Marca</dt><dd>{{ marcaNombre() || '—' }}</dd>
              <dt>Modelo</dt><dd>{{ disp()!.modelo || '—' }}</dd>
              <dt>Serie</dt><dd>{{ disp()!.serie || '—' }}</dd>
              <dt>Color</dt><dd>{{ disp()!.color || '—' }}</dd>
              <dt>Proveedor</dt><dd>{{ disp()!.proveedor || '—' }}</dd>
              <dt>Orden compra</dt><dd>{{ disp()!.orden_compra || '—' }}</dd>
              <dt>Fecha registro</dt><dd>{{ disp()!.fecha_registro | slice:0:10 }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <!-- Ubicación -->
        <mat-card class="sigtic-card">
          <mat-card-title>Ubicación y Responsable</mat-card-title>
          <mat-card-content>
            <dl class="info-list">
              <dt>Sede</dt><dd>{{ disp()!.sede ?? '—' }}</dd>
              <dt>Unidad orgánica</dt><dd>{{ disp()!.unidad_organica ?? '—' }}</dd>
              <dt>Responsable</dt><dd>{{ disp()!.responsable ?? '—' }}</dd>
              <dt>DNI resp.</dt><dd>{{ disp()!.dni_responsable || '—' }}</dd>
            </dl>
            @if (disp()!.observacion) {
              <mat-divider class="my-12" />
              <h4>Observaciones</h4>
              <p style="font-size:13px;color:#555">{{ disp()!.observacion }}</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Subtabla dinámica -->
        @if (disp()!.computadora) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Computadora</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Tipo PC</dt><dd>{{ disp()!.computadora!.tipo_pc || '—' }}</dd>
                <dt>Nombre equipo</dt><dd>{{ disp()!.computadora!.nombre_equipo || '—' }}</dd>
                <dt>Dominio</dt><dd>{{ disp()!.computadora!.dominio || '—' }}</dd>
                <dt>IP</dt><dd>{{ disp()!.computadora!.ip || '—' }}</dd>
                <dt>MAC</dt><dd>{{ disp()!.computadora!.mac || '—' }}</dd>
                <dt>Almacenamiento</dt><dd>{{ disp()!.computadora!.almacenamiento || '—' }}</dd>
                <dt>Monitor</dt><dd>{{ disp()!.computadora!.cod_monitor || '—' }}</dd>
                <dt>Teclado</dt><dd>{{ disp()!.computadora!.cod_teclado || '—' }}</dd>
                <dt>Lic. Windows</dt><dd>{{ disp()!.computadora!.licencia_windows ? 'Sí' : 'No' }}</dd>
                <dt>Lic. Office</dt><dd>{{ disp()!.computadora!.licencia_office ? 'Sí' : 'No' }}</dd>
                <dt>Antivirus</dt><dd>{{ disp()!.computadora!.antivirus ? 'Sí' : 'No' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.impresora) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Impresora</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Tipo</dt><dd>{{ disp()!.impresora!.tipo || '—' }}</dd>
                <dt>IP</dt><dd>{{ disp()!.impresora!.ip || '—' }}</dd>
                <dt>MAC</dt><dd>{{ disp()!.impresora!.mac || '—' }}</dd>
                <dt>Nombre red</dt><dd>{{ disp()!.impresora!.nombre_red || '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.monitor) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Monitor</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Tamaño</dt><dd>{{ disp()!.monitor!.tamanio_pulgadas ? disp()!.monitor!.tamanio_pulgadas + '"' : '—' }}</dd>
                <dt>Resolución</dt><dd>{{ disp()!.monitor!.resolucion || '—' }}</dd>
                <dt>Panel</dt><dd>{{ disp()!.monitor!.tipo_panel || '—' }}</dd>
                <dt>Conexión</dt><dd>{{ disp()!.monitor!.conexion || '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.periferico) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Periférico</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Subtipo</dt><dd>{{ disp()!.periferico!.subtipo || '—' }}</dd>
                <dt>Conexión</dt><dd>{{ disp()!.periferico!.conexion || '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.red) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Equipo de Red</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Subtipo</dt><dd>{{ disp()!.red!.subtipo || '—' }}</dd>
                <dt>IP</dt><dd>{{ disp()!.red!.ip || '—' }}</dd>
                <dt>MAC</dt><dd>{{ disp()!.red!.mac || '—' }}</dd>
                <dt>Nombre red</dt><dd>{{ disp()!.red!.nombre_red || '—' }}</dd>
                <dt>Puertos</dt><dd>{{ disp()!.red!.puertos ?? '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.camara) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Cámara</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Tipo</dt><dd>{{ disp()!.camara!.tipo_camara || '—' }}</dd>
                <dt>IP</dt><dd>{{ disp()!.camara!.ip || '—' }}</dd>
                <dt>MAC</dt><dd>{{ disp()!.camara!.mac || '—' }}</dd>
                <dt>Usuario acceso</dt><dd>{{ disp()!.camara!.usuario_acceso || '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
        @if (disp()!.telefono) {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Teléfono</mat-card-title>
            <mat-card-content>
              <dl class="info-list">
                <dt>Extensión</dt><dd>{{ disp()!.telefono!.extension || '—' }}</dd>
                <dt>IP</dt><dd>{{ disp()!.telefono!.ip || '—' }}</dd>
                <dt>MAC</dt><dd>{{ disp()!.telefono!.mac || '—' }}</dd>
              </dl>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
  `],
})
export class InventarioDetailComponent implements OnInit {
  @Input() id!: string;
  auth = inject(AuthService);
  private inventarioService = inject(InventarioService);
  private snackBar = inject(MatSnackBar);

  disp = signal<DispositivoDetail | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.inventarioService.get(+this.id).subscribe({
      next: d => { this.disp.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar dispositivo', 'Cerrar', { duration: 3000 }); },
    });
  }

  marcaNombre(): string {
    return '';
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      OPERATIVO: 'badge-solucionado',
      EN_MANTENIMIENTO: 'badge-en_mantenimiento',
      DE_BAJA: 'badge-rechazado',
      ALMACEN: 'badge-en_revision',
    };
    return map[estado] ?? '';
  }
}
