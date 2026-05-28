import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { switchMap, of, defaultIfEmpty } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // loadMe() retorna EMPTY si el usuario no tiene sesión activa.
  // defaultIfEmpty garantiza que el guard siempre emite (evita EmptyError).
  return auth.loadMe().pipe(
    switchMap(() => of(auth.isAuthenticated() ? true : router.createUrlTree(['/login']))),
    defaultIfEmpty(router.createUrlTree(['/login'])),
  );
};
