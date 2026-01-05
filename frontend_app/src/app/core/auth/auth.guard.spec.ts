import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { of } from 'rxjs';

describe('authGuard', () => {
  it('should redirect to /login when unauthenticated', (done) => {
    const routerStub = {
      createUrlTree: (_commands: any[], extras: any) => ({ extras } as unknown as UrlTree),
    };

    const authStub = {
      ensureHydrated$: () => of(void 0),
      getToken: () => null,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerStub },
        { provide: AuthService, useValue: authStub },
      ],
    });

    // Run the functional guard within Angular injection context.
    const result$ = TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/data' } as any));

    (result$ as any).subscribe((res: boolean | UrlTree) => {
      expect(res).not.toBe(true);
      const tree = res as any;
      expect(tree.extras?.queryParams?.returnUrl).toBe('/data');
      done();
    });
  });
});
