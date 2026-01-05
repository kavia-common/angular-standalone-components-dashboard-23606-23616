import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { getAppEnvironment } from '../environment';

export type HealthStatus = Readonly<{
  ok: boolean;
  message?: string;
}>;

export type DashboardStatus = Readonly<{
  health: HealthStatus;
  apiBase: string;
  wsUrl: string;
  env: string;
}>;

export type ActivityItem = Readonly<{
  id: string;
  title: string;
  detail?: string;
  ts: string; // ISO timestamp
  severity?: 'info' | 'success' | 'warn' | 'error';
}>;

/**
 * Minimal API client wrapper.
 * Centralizes base URL usage and provides a few lightweight "dashboard" queries.
 *
 * IMPORTANT:
 * - No hardcoded URLs: base is derived from NG_APP_API_BASE / NG_APP_BACKEND_URL.
 * - All API calls are resilient: they fall back to safe local values when endpoints are missing.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly env = getAppEnvironment();

  constructor(private readonly http: HttpClient) {}

  // PUBLIC_INTERFACE
  getBaseUrl(): string {
    /** This is a public function. */
    return this.env.apiBase || this.env.backendUrl;
  }

  private buildUrl(path: string): string {
    const base = this.getBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;

    // If base isn't configured we still return the path so the app remains usable in demo mode.
    return base ? `${base}${p}` : p;
  }

  // PUBLIC_INTERFACE
  getHealth$(): Observable<HealthStatus> {
    /** This is a public function. */
    const url = this.buildUrl(this.env.healthcheckPath || '/healthz');
    return this.http.get<unknown>(url).pipe(
      map((resp) => {
        // Try to normalize common shapes: { ok: true }, { status: 'ok' }, etc.
        if (typeof resp === 'object' && resp !== null) {
          const r = resp as Record<string, unknown>;
          const okRaw = r['ok'] ?? r['status'] ?? r['healthy'];
          const ok =
            okRaw === true ||
            okRaw === 'ok' ||
            okRaw === 'OK' ||
            okRaw === 'healthy' ||
            okRaw === 'UP' ||
            okRaw === 'up';
          const message =
            typeof r['message'] === 'string'
              ? (r['message'] as string)
              : typeof r['detail'] === 'string'
                ? (r['detail'] as string)
                : undefined;
          return { ok, message };
        }
        return { ok: true };
      }),
      catchError(() =>
        of({
          ok: false,
          message:
            'Health endpoint unavailable. Set NG_APP_API_BASE / NG_APP_BACKEND_URL and ensure healthcheck path exists.',
        }),
      ),
    );
  }

  // PUBLIC_INTERFACE
  getDashboardStatus$(): Observable<DashboardStatus> {
    /** This is a public function. */
    return this.getHealth$().pipe(
      map((health) => ({
        health,
        apiBase: this.getBaseUrl(),
        wsUrl: this.env.wsUrl,
        env: this.env.nodeEnv,
      })),
    );
  }

  // PUBLIC_INTERFACE
  getActivity$(): Observable<ActivityItem[]> {
    /** This is a public function. */
    const url = this.buildUrl('/activity');

    return this.http.get<ActivityItem[]>(url).pipe(
      // Even if a backend implements /activity differently, keep the UI resilient.
      map((items) =>
        (items ?? []).map((i) => ({
          ...i,
          severity: i.severity ?? 'info',
        })),
      ),
      catchError(() =>
        of<ActivityItem[]>([
          {
            id: 'local-1',
            title: 'Demo mode',
            detail: 'No /activity endpoint detected. Showing sample activity.',
            ts: new Date().toISOString(),
            severity: 'info',
          },
          {
            id: 'local-2',
            title: 'Environment loaded',
            detail: `NG_APP_NODE_ENV=${this.env.nodeEnv}`,
            ts: new Date(Date.now() - 5 * 60_000).toISOString(),
            severity: 'success',
          },
        ]),
      ),
    );
  }
}
