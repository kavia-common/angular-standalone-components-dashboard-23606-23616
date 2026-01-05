import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export type DashboardMetricSeries = Readonly<{
  label: string;
  data: number[];
}>;

export type DashboardMetrics = Readonly<{
  labels: string[];
  series: DashboardMetricSeries[];
  updatedAt: string; // ISO timestamp
}>;

export type DataRecord = Readonly<{
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Error';
  owner: string;
  createdAt: string; // ISO timestamp
  score: number; // 0..100
}>;

export type DataQuery = Readonly<{
  page: number; // 1-based
  pageSize: number;
  sortField?: string;
  sortOrder?: 1 | -1;
  globalFilter?: string;
}>;

export type DataPage = Readonly<{
  items: DataRecord[];
  total: number;
  page: number;
  pageSize: number;
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

  private fallbackMetrics(): DashboardMetrics {
    const now = Date.now();
    const labels = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now - (11 - i) * 60 * 60_000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    // Deterministic-ish series from the hour to avoid "random flicker" between refreshes.
    const seed = new Date().getHours() + new Date().getDate();
    const wave = (base: number, amp: number, step: number) =>
      labels.map((_, idx) => Math.round(base + amp * Math.sin((idx + seed) / step)));

    return {
      labels,
      series: [
        { label: 'Requests', data: wave(120, 35, 2.3) },
        { label: 'Errors', data: wave(10, 6, 1.7).map((n) => Math.max(0, n - 8)) },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Accepts either:
   * - { labels: string[], series: {label,data}[] }
   * - { labels: string[], datasets: Chart.js style datasets[] }
   * - { data: { labels, datasets }, meta?: { updatedAt } } (common API shape)
   */
  private normalizeMetrics(resp: unknown): DashboardMetrics | null {
    if (!resp || typeof resp !== 'object') return null;

    const r = resp as Record<string, unknown>;
    const updatedAt =
      typeof r['updatedAt'] === 'string'
        ? (r['updatedAt'] as string)
        : typeof (r['meta'] as Record<string, unknown> | undefined)?.['updatedAt'] === 'string'
          ? ((r['meta'] as Record<string, unknown>)['updatedAt'] as string)
          : new Date().toISOString();

    const tryFrom = (obj: unknown): { labels: string[]; series: DashboardMetricSeries[] } | null => {
      if (!obj || typeof obj !== 'object') return null;
      const o = obj as Record<string, unknown>;

      const labelsRaw = o['labels'];
      const labels = Array.isArray(labelsRaw) ? labelsRaw.filter((x) => typeof x === 'string') : [];
      if (!labels.length) return null;

      const seriesRaw = o['series'];
      if (Array.isArray(seriesRaw)) {
        const series: DashboardMetricSeries[] = seriesRaw
          .map((s) => (typeof s === 'object' && s ? (s as Record<string, unknown>) : null))
          .filter((s): s is Record<string, unknown> => !!s)
          .map((s) => ({
            label: typeof s['label'] === 'string' ? (s['label'] as string) : 'Series',
            data: Array.isArray(s['data']) ? (s['data'] as unknown[]).map((n) => Number(n) || 0) : [],
          }))
          .filter((s) => s.data.length > 0);

        if (series.length) return { labels, series };
      }

      const datasetsRaw = o['datasets'];
      if (Array.isArray(datasetsRaw)) {
        const series: DashboardMetricSeries[] = datasetsRaw
          .map((d) => (typeof d === 'object' && d ? (d as Record<string, unknown>) : null))
          .filter((d): d is Record<string, unknown> => !!d)
          .map((d) => ({
            label: typeof d['label'] === 'string' ? (d['label'] as string) : 'Series',
            data: Array.isArray(d['data']) ? (d['data'] as unknown[]).map((n) => Number(n) || 0) : [],
          }))
          .filter((s) => s.data.length > 0);

        if (series.length) return { labels, series };
      }

      return null;
    };

    // direct
    const direct = tryFrom(r);
    if (direct) return { ...direct, updatedAt };

    // nested under "data"
    const nested = tryFrom(r['data']);
    if (nested) return { ...nested, updatedAt };

    return null;
  }

  // PUBLIC_INTERFACE
  getDashboardMetrics$(): Observable<DashboardMetrics> {
    /** This is a public function. */
    const url = this.buildUrl('/metrics');
    return this.http.get<unknown>(url).pipe(
      map((resp) => this.normalizeMetrics(resp) ?? this.fallbackMetrics()),
      catchError(() => of(this.fallbackMetrics())),
    );
  }

  private fallbackDataRecords(total: number): DataRecord[] {
    const statuses: DataRecord['status'][] = ['Active', 'Paused', 'Error'];
    const owners = ['Avery', 'Jordan', 'Casey', 'Sam', 'Taylor'];

    const base = Date.now();
    return Array.from({ length: total }).map((_, i) => {
      const status = statuses[i % statuses.length];
      const createdAt = new Date(base - i * 36 * 60_000).toISOString();
      const score = Math.max(0, Math.min(100, 55 + Math.round(35 * Math.sin((i + 3) / 3.2))));
      return {
        id: `rec-${i + 1}`,
        name: `Dataset ${i + 1}`,
        status,
        owner: owners[i % owners.length],
        createdAt,
        score,
      };
    });
  }

  private applyFallbackDataQuery(items: DataRecord[], query: DataQuery): DataPage {
    const filter = (query.globalFilter ?? '').trim().toLowerCase();
    const filtered = !filter
      ? items
      : items.filter((r) => {
          const hay = `${r.id} ${r.name} ${r.status} ${r.owner}`.toLowerCase();
          return hay.includes(filter);
        });

    const sorted = (() => {
      if (!query.sortField) return filtered;
      const field = query.sortField as keyof DataRecord;
      const order = query.sortOrder ?? 1;

      return [...filtered].sort((a, b) => {
        const av = a[field] as unknown;
        const bv = b[field] as unknown;
        if (typeof av === 'number' && typeof bv === 'number') return order * (av - bv);
        return order * String(av).localeCompare(String(bv));
      });
    })();

    const total = sorted.length;
    const start = (query.page - 1) * query.pageSize;
    const pageItems = sorted.slice(start, start + query.pageSize);

    return { items: pageItems, total, page: query.page, pageSize: query.pageSize };
  }

  private normalizeDataPage(resp: unknown, fallbackQuery: DataQuery): DataPage | null {
    if (!resp || typeof resp !== 'object') return null;
    const r = resp as Record<string, unknown>;

    const itemsRaw = r['items'] ?? r['data'] ?? r['results'];
    const totalRaw = r['total'] ?? r['count'] ?? r['totalCount'];

    if (!Array.isArray(itemsRaw)) return null;

    const items: DataRecord[] = itemsRaw
      .map((x) => (typeof x === 'object' && x ? (x as Record<string, unknown>) : null))
      .filter((x): x is Record<string, unknown> => !!x)
      .map((x, idx) => ({
        id: typeof x['id'] === 'string' ? (x['id'] as string) : `remote-${idx + 1}`,
        name: typeof x['name'] === 'string' ? (x['name'] as string) : `Record ${idx + 1}`,
        status:
          x['status'] === 'Active' || x['status'] === 'Paused' || x['status'] === 'Error'
            ? (x['status'] as DataRecord['status'])
            : 'Active',
        owner: typeof x['owner'] === 'string' ? (x['owner'] as string) : 'Unknown',
        createdAt: typeof x['createdAt'] === 'string' ? (x['createdAt'] as string) : new Date().toISOString(),
        score: typeof x['score'] === 'number' ? (x['score'] as number) : Number(x['score']) || 0,
      }));

    const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw);
    return {
      items,
      total: Number.isFinite(total) && total > 0 ? total : items.length,
      page: fallbackQuery.page,
      pageSize: fallbackQuery.pageSize,
    };
  }

  // PUBLIC_INTERFACE
  getDataPage$(query: DataQuery): Observable<DataPage> {
    /** This is a public function. */
    const url = this.buildUrl('/data');

    // If the backend supports server-side pagination, we send parameters; if not, we still work via fallback.
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));

    if (query.sortField) params = params.set('sortField', query.sortField);
    if (query.sortOrder) params = params.set('sortOrder', String(query.sortOrder));
    if (query.globalFilter) params = params.set('q', query.globalFilter);

    const fallbackAll = this.fallbackDataRecords(57);

    return this.http.get<unknown>(url, { params }).pipe(
      map((resp) => this.normalizeDataPage(resp, query) ?? this.applyFallbackDataQuery(fallbackAll, query)),
      catchError(() => of(this.applyFallbackDataQuery(fallbackAll, query))),
    );
  }
}
