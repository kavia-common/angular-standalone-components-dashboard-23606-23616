import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Standalone auth guard.
 * Redirects to /login when unauthenticated and passes returnUrl so login can navigate back.
 */
// PUBLIC_INTERFACE
export const authGuard: CanActivateFn = (_route, state): Observable<boolean | UrlTree> => {
  /** This is a public function. */
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureHydrated$().pipe(
    map(() => {
      const token = auth.getToken();
      if (token) return true;

      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url || '/'},
      });
    }),
  );
};
