import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';

import {
  ApiClientService,
  DataPage as DataPageResult,
  DataQuery,
  DataRecord,
} from '../../core/api/api-client.service';

@Component({
  selector: 'app-data-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    MessageModule,
  ],
  template: `
    <div class="space-y-6" data-testid="data-page">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-xl font-semibold">Data</h1>
          <p class="mt-1 text-sm text-gray-600">
            PrimeNG table with sorting, filtering, pagination, and responsive layout.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            label="Reload"
            class="p-button-outlined"
            (click)="reload()"
            aria-label="Reload data table"
            data-testid="data-reload"
          ></button>
        </div>
      </div>

      <p-card>
        <ng-template pTemplate="content">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2">
              <span class="p-input-icon-left w-full md:w-80">
                <i class="pi pi-search" aria-hidden="true"></i>
                <input
                  pInputText
                  type="text"
                  class="w-full"
                  placeholder="Search id, name, status, owner..."
                  [(ngModel)]="globalFilter"
                  (ngModelChange)="onGlobalFilterChange($event)"
                  aria-label="Global search"
                  data-testid="data-global-filter"
                />
              </span>
            </div>

            <div class="text-xs text-gray-500">
              Endpoint:
              <span class="font-mono">{{ apiBase || '(demo mode)' }}</span>
            </div>
          </div>

          <div class="mt-4">
            <ng-container *ngIf="loading; else tableBlock">
              <div class="space-y-3" aria-label="Loading table">
                <p-skeleton height="2.5rem" styleClass="w-full"></p-skeleton>
                <p-skeleton height="12rem" styleClass="w-full"></p-skeleton>
              </div>
            </ng-container>

            <ng-template #tableBlock>
              <div *ngIf="errorMessage" class="mb-3" data-testid="data-error">
                <p-message severity="error" [text]="errorMessage"></p-message>
              </div>

              <p-table
                [value]="items"
                [paginator]="true"
                [rows]="query.pageSize"
                [totalRecords]="total"
                [rowsPerPageOptions]="[5, 10, 20, 50]"
                [lazy]="true"
                [loading]="false"
                [responsiveLayout]="'scroll'"
                [sortField]="query.sortField"
                [sortOrder]="query.sortOrder ?? 1"
                (onLazyLoad)="onLazyLoad($event)"
                data-testid="data-table"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="id" style="min-width: 8rem">
                      ID <p-sortIcon field="id"></p-sortIcon>
                    </th>
                    <th pSortableColumn="name" style="min-width: 14rem">
                      Name <p-sortIcon field="name"></p-sortIcon>
                    </th>
                    <th pSortableColumn="status" style="min-width: 10rem">
                      Status <p-sortIcon field="status"></p-sortIcon>
                    </th>
                    <th pSortableColumn="owner" style="min-width: 10rem">
                      Owner <p-sortIcon field="owner"></p-sortIcon>
                    </th>
                    <th pSortableColumn="score" style="min-width: 8rem">
                      Score <p-sortIcon field="score"></p-sortIcon>
                    </th>
                    <th pSortableColumn="createdAt" style="min-width: 12rem">
                      Created <p-sortIcon field="createdAt"></p-sortIcon>
                    </th>
                  </tr>

                  <tr>
                    <th>
                      <input
                        pInputText
                        type="text"
                        class="w-full"
                        placeholder="Filter ID"
                        (input)="setColumnFilter('id', $any($event.target).value)"
                        aria-label="Filter by id"
                        data-testid="filter-id"
                      />
                    </th>
                    <th>
                      <input
                        pInputText
                        type="text"
                        class="w-full"
                        placeholder="Filter Name"
                        (input)="setColumnFilter('name', $any($event.target).value)"
                        aria-label="Filter by name"
                        data-testid="filter-name"
                      />
                    </th>
                    <th>
                      <input
                        pInputText
                        type="text"
                        class="w-full"
                        placeholder="Filter Status"
                        (input)="setColumnFilter('status', $any($event.target).value)"
                        aria-label="Filter by status"
                        data-testid="filter-status"
                      />
                    </th>
                    <th>
                      <input
                        pInputText
                        type="text"
                        class="w-full"
                        placeholder="Filter Owner"
                        (input)="setColumnFilter('owner', $any($event.target).value)"
                        aria-label="Filter by owner"
                        data-testid="filter-owner"
                      />
                    </th>
                    <th></th>
                    <th></th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row>
                  <tr [attr.data-testid]="'data-row-' + row.id">
                    <td class="font-mono text-xs text-gray-700">{{ row.id }}</td>
                    <td class="text-sm font-medium text-gray-900">{{ row.name }}</td>
                    <td>
                      <p-tag
                        [severity]="statusSeverity(row.status)"
                        [value]="row.status"
                        [attr.aria-label]="'Status ' + row.status"
                      ></p-tag>
                    </td>
                    <td class="text-sm text-gray-700">{{ row.owner }}</td>
                    <td class="text-sm text-gray-700">{{ row.score }}</td>
                    <td class="text-sm text-gray-600">{{ row.createdAt | date: 'short' }}</td>
                  </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="6">
                      <div class="rounded-xl bg-gray-50 p-4 text-sm text-gray-600" data-testid="data-empty">
                        No records match your filters.
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-xs text-gray-500" data-testid="data-count">
                  Showing {{ items.length }} of {{ total }} records
                </div>

                <div class="text-xs text-gray-500">
                  Tip: sorting/pagination are env-driven via <span class="font-mono">ApiClientService</span> fallback.
                </div>
              </div>
            </ng-template>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataPage {
  private readonly api = inject(ApiClientService);

  protected readonly apiBase = this.api.getBaseUrl();

  protected loading = true;
  protected errorMessage = '';
  protected items: DataRecord[] = [];
  protected total = 0;

  protected globalFilter = '';

  protected query: DataQuery = {
    page: 1,
    pageSize: 10,
    sortField: 'createdAt',
    sortOrder: -1,
    globalFilter: '',
  };

  /**
   * Column filters are implemented client-side by mapping into the globalFilter query:
   * - This keeps SSR-safe simplicity without relying on browser-only APIs.
   * - If backend supports server-side advanced filtering later, we can extend getDataPage$.
   */
  private columnFilters: Record<string, string> = {};

  constructor() {
    this.load();
  }

  protected reload(): void {
    this.load();
  }

  protected onGlobalFilterChange(value: string): void {
    this.globalFilter = value;
    this.query = { ...this.query, page: 1, globalFilter: this.composeFilterQuery() };
    this.load();
  }

  protected setColumnFilter(field: string, value: string): void {
    this.columnFilters[field] = value ?? '';
    this.query = { ...this.query, page: 1, globalFilter: this.composeFilterQuery() };
    this.load();
  }

  protected onLazyLoad(event: any): void {
    // PrimeNG Table provides "first" (offset) and "rows" (page size).
    const rows = typeof event?.rows === 'number' ? event.rows : this.query.pageSize;
    const first = typeof event?.first === 'number' ? event.first : 0;

    const page = Math.floor(first / rows) + 1;

    const sortField = typeof event?.sortField === 'string' ? event.sortField : this.query.sortField;
    const sortOrder = event?.sortOrder === 1 || event?.sortOrder === -1 ? (event.sortOrder as 1 | -1) : this.query.sortOrder;

    this.query = {
      ...this.query,
      page,
      pageSize: rows,
      sortField: sortField ?? undefined,
      sortOrder: sortOrder ?? undefined,
      globalFilter: this.composeFilterQuery(),
    };

    this.load();
  }

  protected statusSeverity(status: DataRecord['status']): 'success' | 'warn' | 'danger' {
    if (status === 'Active') return 'success';
    if (status === 'Paused') return 'warn';
    return 'danger';
  }

  private composeFilterQuery(): string {
    const parts: string[] = [];
    const global = (this.globalFilter ?? '').trim();
    if (global) parts.push(global);

    // Encode field filters in a human-friendly combined query; the fallback matcher treats it as substring.
    for (const [k, v] of Object.entries(this.columnFilters)) {
      const trimmed = (v ?? '').trim();
      if (trimmed) parts.push(`${k}:${trimmed}`);
    }

    return parts.join(' ');
  }

  private load(): void {
    this.loading = true;
    this.errorMessage = '';

    // Keep this as a single subscription pattern; page is standalone and short-lived.
    // (Could be refactored to signals later, but we keep SSR stability and minimal moving parts.)
    const obs: Observable<DataPageResult> = this.api.getDataPage$(this.query);

    obs.subscribe({
      next: (page) => {
        this.items = page.items;
        this.total = page.total;
        this.loading = false;
      },
      error: () => {
        // Should be rare because ApiClientService always falls back.
        this.errorMessage = 'Unable to load data. Please check API configuration.';
        this.items = [];
        this.total = 0;
        this.loading = false;
      },
    });
  }
}
