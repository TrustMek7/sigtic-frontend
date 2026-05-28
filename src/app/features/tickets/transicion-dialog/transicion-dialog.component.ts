import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TicketDetail, UserProfile, EstadoTicket } from '../../../shared/models';

interface TransicionData {
  ticket: TicketDetail;
  tecnicos: UserProfile[];
}

const TRANSICIONES: Record<EstadoTicket, { value: EstadoTicket; label: string }[]> = {
  ENVIADO:           [{ value: 'EN_REVISION', label: 'En Revisión' }, { value: 'RECHAZADO', label: 'Rechazar' }],
  EN_REVISION:       [{ value: 'ASIGNADO', label: 'Asignar' }, { value: 'RECHAZADO', label: 'Rechazar' }],
  ASIGNADO:          [{ value: 'EN_ATENCION', label: 'Iniciar Atención' }, { value: 'RECHAZADO', label: 'Rechazar' }],
  EN_ATENCION:       [{ value: 'SOLUCIONADO', label: 'Solucionado (Menor)' }, { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento (Mayor)' }, { value: 'TERCERIZADO', label: 'Tercerizar' }, { value: 'RECHAZADO', label: 'Rechazar' }],
  SOLUCIONADO:       [],
  EN_MANTENIMIENTO:  [{ value: 'FINALIZADO', label: 'Finalizado' }],
  TERCERIZADO:       [{ value: 'FINALIZADO', label: 'Finalizado' }],
  FINALIZADO:        [],
  RECHAZADO:         [],
};

@Component({
  selector: 'app-transicion-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar Estado — {{ data.ticket.numero }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nuevo estado</mat-label>
          <mat-select formControlName="nuevo_estado">
            @for (t of opciones; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (requiereTecnico()) {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Asignar técnico</mat-label>
            <mat-select formControlName="tecnico_id">
              @for (tec of data.tecnicos; track tec.id) {
                <mat-option [value]="tec.id">{{ tec.nombre_completo }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full">
          <mat-label>Comentario (opcional)</mat-label>
          <textarea matInput formControlName="comentario" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="confirm()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 380px; } .full { width: 100%; }`],
})
export class TransicionDialogComponent {
  ref = inject(MatDialogRef<TransicionDialogComponent>);
  data: TransicionData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  opciones = TRANSICIONES[this.data.ticket.estado] ?? [];

  form = this.fb.group({
    nuevo_estado: ['', Validators.required],
    tecnico_id: [null as number | null],
    comentario: [''],
  });

  requiereTecnico(): boolean {
    return this.form.get('nuevo_estado')?.value === 'ASIGNADO';
  }

  confirm() {
    if (this.form.invalid) return;
    const { nuevo_estado, tecnico_id, comentario } = this.form.value;
    const payload: Record<string, unknown> = { nuevo_estado, comentario };
    if (tecnico_id) payload['tecnico_id'] = tecnico_id;
    this.ref.close(payload);
  }
}
