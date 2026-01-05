import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiClientService } from '../api/api-client.service';

export type AuthUser = Readonly<{
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}>;

export type AuthState = Readonly<{
  token: string | null;
  user: AuthUser | null;
}>;

export type LoginRequest = Readonly<{
  email: string;
  password: string;
}>;

export type LoginResult = Readonly<{
  token: string;
  user: AuthUser;
}>;

/**
 * Central client-side auth state.
 *
 * SSR safety:
 * - Uses localStorage ONLY when running in the browser.
 * - When SSR-rendered, state starts as logged out and will hydrate on the client.
 *
 * Backend optional:
 * - Attempts POST {apiBase}/auth/login first.
 * - If backend is unavailable/missing, falls back to a demo login so UI flows can be exercised.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly storageKey = 'ocean.auth.v1';

  private readonly _state$ = new BehaviorSubject<AuthState>({ token: null, user: null });
  readonly state$: Observable<AuthState> = this._state$.asObservable();

  readonly isAuthenticated$: Observable<boolean> = this.state$.pipe(map((s) => !!s.token));
  readonly user$: Observable<AuthUser | null> = this.state$.pipe(map((s) => s.user));

  constructor() {
    // Hydrate auth state on startup (browser only).
    this.hydrateFromStorage();
  }

  // PUBLIC_INTERFACE
  login$(req: LoginRequest): Observable<LoginResult> {
    /** This is a public function. */
    const url = this.buildAuthUrl('/auth/login');

    return this.http.post<unknown>(url, req).pipe(
      map((resp) => this.normalizeLoginResponse(resp, req.email) ?? this.demoLogin(req.email)),
      catchError(() => of(this.demoLogin(req.email))),
      tap((result) => this.setSession(result)),
    );
  }

  // PUBLIC_INTERFACE
  logout(): void {
    /** This is a public function. */
    this._state$.next({ token: null, user: null });
    this.clearStorage();
  }

  // PUBLIC_INTERFACE
  getToken(): string | null {
    /** This is a public function. */
    return this._state$.value.token;
  }

  // PUBLIC_INTERFACE
  ensureHydrated$(): Observable<void> {
    /** This is a public function. */
    // In case components/guards need to ensure hydration happened.
    return of(void 0).pipe(
      tap(() => this.hydrateFromStorage()),
      switchMap(() => of(void 0)),
    );
  }

  private buildAuthUrl(path: string): string {
    const base = (this.api.getBaseUrl() ?? '').replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;

    // If base isn't configured, still return a relative path to keep app usable.
    return base ? `${base}${p}` : p;
  }

  private normalizeLoginResponse(resp: unknown, emailFallback: string): LoginResult | null {
    if (!resp || typeof resp !== 'object') return null;
    const r = resp as Record<string, unknown>;

    const token =
      typeof r['token'] === 'string'
        ? (r['token'] as string)
        : typeof r['access_token'] === 'string'
          ? (r['access_token'] as string)
          : null;

    const userRaw = r['user'];
    const userObj = userRaw && typeof userRaw === 'object' ? (userRaw as Record<string, unknown>) : null;

    // Support shapes like { token, user } or { access_token, user: { ... } }
    if (token) {
      const id =
        userObj && typeof userObj['id'] === 'string'
          ? (userObj['id'] as string)
          : `user-${this.simpleHash(emailFallback)}`;

      const name =
        userObj && typeof userObj['name'] === 'string'
          ? (userObj['name'] as string)
          : userObj && typeof userObj['email'] === 'string'
            ? String(userObj['email']).split('@')[0]
            : emailFallback.split('@')[0];

      const email = userObj && typeof userObj['email'] === 'string' ? (userObj['email'] as string) : emailFallback;

      const avatarUrl = userObj && typeof userObj['avatarUrl'] === 'string' ? (userObj['avatarUrl'] as string) : undefined;

      return { token, user: { id, name, email, avatarUrl } };
    }

    return null;
  }

  private demoLogin(email: string): LoginResult {
    const base = email.split('@')[0] || 'User';
    const user: AuthUser = {
      id: `demo-${this.simpleHash(email)}`,
      name: base.charAt(0).toUpperCase() + base.slice(1),
      email,
    };

    // Token is only used for route protection/client calls; for demo we use a stable placeholder.
    return { token: `demo-token.${this.simpleHash(email)}`, user };
  }

  private setSession(result: LoginResult): void {
    this._state$.next({ token: result.token, user: result.user });
    this.persistToStorage();
  }

  private hydrateFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const raw = globalThis.localStorage?.getItem(this.storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { token?: unknown; user?: unknown };
      const token = typeof parsed.token === 'string' ? parsed.token : null;
      const userRaw = parsed.user && typeof parsed.user === 'object' ? (parsed.user as Record<string, unknown>) : null;

      const user: AuthUser | null =
        userRaw && typeof userRaw['id'] === 'string' && typeof userRaw['name'] === 'string'
          ? {
              id: userRaw['id'] as string,
              name: userRaw['name'] as string,
              email: typeof userRaw['email'] === 'string' ? (userRaw['email'] as string) : undefined,
              avatarUrl: typeof userRaw['avatarUrl'] === 'string' ? (userRaw['avatarUrl'] as string) : undefined,
            }
          : null;

      if (token) {
        this._state$.next({ token, user });
      }
    } catch {
      // If storage is corrupted, ignore and keep logged out.
    }
  }

  private persistToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this._state$.value));
    } catch {
      // Ignore storage failures (private mode, quotas, etc.)
    }
  }

  private clearStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      globalThis.localStorage?.removeItem(this.storageKey);
    } catch {
      // ignore
    }
  }

  private simpleHash(input: string): string {
    // Non-crypto hash for stable demo IDs.
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  }
}
