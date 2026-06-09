import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

const BASE_CONFIG = {
  horizontalPosition: 'right' as const,
  verticalPosition: 'top' as const,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  success(msg: string, duration = 3000): void {
    this.snackBar.open(msg, undefined, {
      ...BASE_CONFIG,
      duration,
      panelClass: ['toast', 'toast-success'],
    });
  }

  error(msg: string, duration = 6000): void {
    this.snackBar.open(msg, '✕', {
      ...BASE_CONFIG,
      duration,
      panelClass: ['toast', 'toast-error'],
    });
  }

  warning(msg: string, duration = 4000): void {
    this.snackBar.open(msg, undefined, {
      ...BASE_CONFIG,
      duration,
      panelClass: ['toast', 'toast-warning'],
    });
  }

  info(msg: string, duration = 3000): void {
    this.snackBar.open(msg, undefined, {
      ...BASE_CONFIG,
      duration,
      panelClass: ['toast', 'toast-info'],
    });
  }

  /** Para casos que necesitan .onAction() (p.ej. "Descargar" en documentos) */
  successWithAction(msg: string, action: string, duration = 6000): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(msg, action, {
      ...BASE_CONFIG,
      duration,
      panelClass: ['toast', 'toast-success'],
    });
  }
}
