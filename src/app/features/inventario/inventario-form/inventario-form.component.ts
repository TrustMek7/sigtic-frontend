import { Component, inject, OnInit, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsyncPipe } from '@angular/common';
import { InventarioService } from '../../../core/services/inventario.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { DispositivoDetail } from '../../../shared/models';

const ESTADOS_DISPOSITIVO = ['OPERATIVO', 'EN_MANTENIMIENTO', 'DE_BAJA', 'ALMACEN'];
const TIPOS_PC = ['DESKTOP', 'LAPTOP', 'ALL_IN_ONE', 'SERVIDOR'];
const TIPOS_IMPRESORA = ['LASER', 'INKJET', 'MATRICIAL', 'MULTIFUNCION', 'PLOTTER', 'TERMICA'];
const TIPOS_PANEL = ['LCD', 'LED', 'IPS', 'TN', 'VA'];
const CONEXIONES_MONITOR = ['HDMI', 'VGA', 'DVI', 'DP'];
const SUBTIPOS_PERIFERICO = ['TECLADO', 'MOUSE', 'WEBCAM', 'BIOMETRICO', 'TABLET', 'LECTORA_QR', 'OTRO'];
const SUBTIPOS_RED = ['SWITCH', 'ROUTER', 'AP', 'NVR', 'DVR', 'UPS', 'ESTABILIZADOR', 'SERVIDOR'];
const TIPOS_CAMARA = ['DOMO', 'BULLET', 'PTZ'];

@Component({
  selector: 'app-inventario-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, ReactiveFormsModule, AsyncPipe,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEdit() ? 'Editar' : 'Nuevo' }} Dispositivo</h1>
      <button mat-button routerLink="/inventario"><mat-icon>arrow_back</mat-icon> Volver</button>
    </div>

    @if (loadingInit()) {
      <div class="loading-center"><mat-spinner /></div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Info base -->
        <mat-card class="sigtic-card">
          <mat-card-title>Información General</mat-card-title>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Tipo de dispositivo</mat-label>
                <mat-select formControlName="tipo_dispositivo">
                  @for (t of (catalogoService.tipos$ | async) ?? []; track t.id) {
                    <mat-option [value]="t.id">{{ t.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Código de inventario</mat-label>
                <input matInput formControlName="cod_inventario">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Marca</mat-label>
                <mat-select formControlName="marca">
                  <mat-option [value]="null">Sin marca</mat-option>
                  @for (m of (catalogoService.marcas$ | async) ?? []; track m.id) {
                    <mat-option [value]="m.id">{{ m.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Modelo</mat-label>
                <input matInput formControlName="modelo">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Serie</mat-label>
                <input matInput formControlName="serie">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Color</mat-label>
                <input matInput formControlName="color">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  @for (e of estados; track e) {
                    <mat-option [value]="e">{{ e }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fecha registro</mat-label>
                <input matInput formControlName="fecha_registro" type="date">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Proveedor</mat-label>
                <input matInput formControlName="proveedor">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Orden de compra</mat-label>
                <input matInput formControlName="orden_compra">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observaciones</mat-label>
                <textarea matInput formControlName="observacion" rows="2"></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Ubicación -->
        <mat-card class="sigtic-card">
          <mat-card-title>Ubicación y Responsable</mat-card-title>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Sede</mat-label>
                <mat-select formControlName="sede">
                  <mat-option [value]="null">Sin sede</mat-option>
                  @for (s of (catalogoService.sedes$ | async) ?? []; track s.id) {
                    <mat-option [value]="s.id">{{ s.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Unidad Orgánica</mat-label>
                <mat-select formControlName="unidad_organica">
                  <mat-option [value]="null">Sin unidad</mat-option>
                  @for (u of (catalogoService.unidades$ | async) ?? []; track u.id) {
                    <mat-option [value]="u.id">{{ u.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>DNI Responsable</mat-label>
                <input matInput formControlName="dni_responsable" maxlength="8">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Subtabla dinámica -->
        @if (tipoCodigo() === 'COMPUTADORA') {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Computadora</mat-card-title>
            <mat-card-content formGroupName="computadora">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo PC</mat-label>
                  <mat-select formControlName="tipo_pc">
                    @for (t of tiposPC; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Sistema operativo</mat-label>
                  <mat-select formControlName="sistema_operativo">
                    <mat-option [value]="null">N/A</mat-option>
                    @for (so of (catalogoService.sos$ | async) ?? []; track so.id) {
                      <mat-option [value]="so.id">{{ so.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Procesador</mat-label>
                  <mat-select formControlName="procesador">
                    <mat-option [value]="null">N/A</mat-option>
                    @for (p of (catalogoService.procesadores$ | async) ?? []; track p.id) {
                      <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>RAM</mat-label>
                  <mat-select formControlName="memoria_ram">
                    <mat-option [value]="null">N/A</mat-option>
                    @for (r of (catalogoService.memorias$ | async) ?? []; track r.id) {
                      <mat-option [value]="r.id">{{ r.capacidad }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Almacenamiento</mat-label>
                  <input matInput formControlName="almacenamiento" placeholder="Ej: 500GB SSD">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>IP</mat-label>
                  <input matInput formControlName="ip">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>MAC</mat-label>
                  <input matInput formControlName="mac">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Nombre equipo</mat-label>
                  <input matInput formControlName="nombre_equipo">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Dominio</mat-label>
                  <input matInput formControlName="dominio">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cód. Monitor</mat-label>
                  <input matInput formControlName="cod_monitor">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cód. Teclado</mat-label>
                  <input matInput formControlName="cod_teclado">
                </mat-form-field>
                <div class="checkboxes full-width">
                  <mat-checkbox formControlName="licencia_windows">Licencia Windows</mat-checkbox>
                  <mat-checkbox formControlName="licencia_office">Licencia Office</mat-checkbox>
                  <mat-checkbox formControlName="antivirus">Antivirus</mat-checkbox>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (tipoCodigo() === 'IMPRESORA') {
          <mat-card class="sigtic-card">
            <mat-card-title>Detalles de Impresora</mat-card-title>
            <mat-card-content formGroupName="impresora">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select formControlName="tipo">
                    @for (t of tiposImpresora; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>IP</mat-label>
                  <input matInput formControlName="ip">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>MAC</mat-label>
                  <input matInput formControlName="mac">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Nombre en red</mat-label>
                  <input matInput formControlName="nombre_red">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Consumible</mat-label>
                  <mat-select formControlName="consumible">
                    <mat-option [value]="null">N/A</mat-option>
                    @for (c of (catalogoService.consumibles$ | async) ?? []; track c.id) {
                      <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <div class="form-actions" style="margin-top:8px">
          <button mat-button type="button" routerLink="/inventario">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
            @if (submitting()) { <mat-spinner diameter="20" /> } @else { <mat-icon>save</mat-icon> }
            {{ submitting() ? '' : 'Guardar' }}
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .checkboxes { display: flex; gap: 20px; padding: 8px 0; }
  `],
})
export class InventarioFormComponent implements OnInit {
  @Input() id?: string;
  catalogoService = inject(CatalogoService);
  private inventarioService = inject(InventarioService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loadingInit = signal(false);
  submitting = signal(false);
  isEdit = computed(() => !!this.id);

  estados = ESTADOS_DISPOSITIVO;
  tiposPC = TIPOS_PC;
  tiposImpresora = TIPOS_IMPRESORA;
  tiposPanel = TIPOS_PANEL;

  private tiposCache: { id: number; codigo: string }[] = [];

  form = this.fb.group({
    tipo_dispositivo: [null as number | null, Validators.required],
    cod_inventario: ['', Validators.required],
    marca: [null as number | null],
    modelo: [''],
    serie: [''],
    color: [''],
    estado: ['OPERATIVO', Validators.required],
    fecha_registro: [''],
    proveedor: [''],
    orden_compra: [''],
    observacion: [''],
    sede: [null as number | null],
    unidad_organica: [null as number | null],
    dni_responsable: [''],
    computadora: this.fb.group({
      tipo_pc: [''],
      sistema_operativo: [null as number | null],
      procesador: [null as number | null],
      memoria_ram: [null as number | null],
      almacenamiento: [''],
      ip: [''],
      mac: [''],
      nombre_equipo: [''],
      dominio: [''],
      cod_monitor: [''],
      cod_teclado: [''],
      licencia_windows: [false],
      licencia_office: [false],
      antivirus: [false],
    }),
    impresora: this.fb.group({
      tipo: [''],
      ip: [''],
      mac: [''],
      nombre_red: [''],
      consumible: [null as number | null],
    }),
  });

  tipoCodigo = signal<string>('');

  ngOnInit() {
    this.catalogoService.tipos$.subscribe(tipos => { this.tiposCache = tipos; });

    this.form.get('tipo_dispositivo')!.valueChanges.subscribe(id => {
      if (id) {
        const t = this.tiposCache.find(x => x.id === id);
        this.tipoCodigo.set(t?.codigo ?? '');
      } else {
        this.tipoCodigo.set('');
      }
    });

    if (this.id) {
      this.loadingInit.set(true);
      this.inventarioService.get(+this.id).subscribe({
        next: d => {
          this.form.patchValue({
            tipo_dispositivo: d.tipo_dispositivo,
            cod_inventario: d.cod_inventario,
            marca: d.marca,
            modelo: d.modelo,
            serie: d.serie,
            color: d.color,
            estado: d.estado,
            fecha_registro: d.fecha_registro,
            proveedor: d.proveedor,
            orden_compra: d.orden_compra,
            observacion: d.observacion,
            sede: d.sede,
            unidad_organica: d.unidad_organica,
            dni_responsable: d.dni_responsable,
          });
          if (d.computadora) this.form.get('computadora')!.patchValue(d.computadora as any);
          if (d.impresora) this.form.get('impresora')!.patchValue(d.impresora as any);
          this.loadingInit.set(false);
        },
        error: () => { this.loadingInit.set(false); this.snackBar.open('Error al cargar', 'Cerrar', { duration: 3000 }); },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    const raw = this.form.value;
    const payload: Record<string, unknown> = {
      tipo_dispositivo: raw.tipo_dispositivo,
      cod_inventario: raw.cod_inventario,
      marca: raw.marca,
      modelo: raw.modelo,
      serie: raw.serie,
      color: raw.color,
      estado: raw.estado,
      fecha_registro: raw.fecha_registro || null,
      proveedor: raw.proveedor,
      orden_compra: raw.orden_compra,
      observacion: raw.observacion,
      sede: raw.sede,
      unidad_organica: raw.unidad_organica,
      dni_responsable: raw.dni_responsable,
    };

    const tipo = this.tipoCodigo();
    if (tipo === 'COMPUTADORA') payload['computadora'] = raw.computadora;
    if (tipo === 'IMPRESORA') payload['impresora'] = raw.impresora;

    const op = this.id
      ? this.inventarioService.update(+this.id, payload)
      : this.inventarioService.create(payload);

    op.subscribe({
      next: res => {
        this.snackBar.open(this.id ? 'Dispositivo actualizado' : 'Dispositivo creado', 'OK', { duration: 2500 });
        this.router.navigate(['/inventario', res.id]);
      },
      error: err => {
        this.submitting.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Error al guardar', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
