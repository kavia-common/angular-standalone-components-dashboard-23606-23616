import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { ApiClientService, ActivityItem, DashboardStatus } from '../../core/api/api-client.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TagModule, ButtonModule, DividerModule],
  template: `
    <div class="space-y-6">
      <!-- Hero -->
      <div class="rounded-2xl bg-gradient-to-r from-blue-500/10 to-gray-50 p-6 shadow-soft">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight">Ocean Professional Dashboard</h1>
            <p class="mt-1 text-sm text-gray-600">
              Cohesive sections • PrimeNG + Tailwind • End-to-end env-driven data flow
            </p>
          </div>

          <div class="flex items-center gap-2">
            <ng-container *ngIf="status$ | async as s">
              <p-tag [severity]="s.health.ok ? 'success' : 'danger'" [value]="s.health.ok ? 'Healthy' : 'Degraded'"></p-tag>
              <p-tag severity="info" [value]="'ENV: ' + s.env"></p-tag>
            </ng-container>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <a routerLink="/settings">
            <button pButton type="button" icon="pi pi-cog" label="Review settings" class="p-button-outlined"></button>
          </a>

          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            label="Refresh"
            class="p-button-text"
            (click)="refresh()"
            aria-label="Refresh dashboard data"
          ></button>
        </div>
      </div>

      <!-- Status cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" *ngIf="status$ | async as s">
        <p-card>
          <ng-template pTemplate="title">Healthcheck</ng-template>
          <p class="text-sm text-gray-600">
            {{ s.health.ok ? 'Service is responding.' : 'No response from configured health endpoint.' }}
          </p>
          <div class="mt-4 flex items-center gap-2">
            <span
              class="h-3 w-3 rounded-full"
              [class.bg-green-500]="s.health.ok"
              [class.bg-red-500]="!s.health.ok"
            ></span>
            <span class="text-sm font-medium" [class.text-green-700]="s.health.ok" [class.text-red-700]="!s.health.ok">
              {{ s.health.ok ? 'OK' : 'DOWN' }}
            </span>
          </div>
          <div *ngIf="s.health.message" class="mt-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
            {{ s.health.message }}
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">API Base</ng-template>
          <p class="text-sm text-gray-600">Derived from NG_APP_API_BASE / NG_APP_BACKEND_URL</p>
          <div class="mt-4 rounded-lg bg-gray-50 p-2 font-mono text-xs text-gray-700">
            {{ s.apiBase || '(not set)' }}
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">WebSocket</ng-template>
          <p class="text-sm text-gray-600">Configured via NG_APP_WS_URL</p>
          <div class="mt-4 rounded-lg bg-gray-50 p-2 font-mono text-xs text-gray-700">
            {{ s.wsUrl || '(not set)' }}
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">Theme</ng-template>
          <p class="text-sm text-gray-600">Ocean Professional accents</p>
          <div class="mt-4 flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-[var(--ocean-primary)]"></span>
            <span class="font-mono text-xs text-gray-700">primary</span>
            <span class="h-3 w-3 rounded-full bg-[var(--ocean-secondary)] ml-2"></span>
            <span class="font-mono text-xs text-gray-700">secondary</span>
          </div>
        </p-card>
      </div>

      <p-divider></p-divider>

      <!-- Activity + Settings -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <p-card>
            <ng-template pTemplate="title">Recent Activity</ng-template>
            <ng-template pTemplate="subtitle">Pulled from /activity when available; otherwise demo entries.</ng-template>

            <div class="space-y-3" *ngIf="activity$ | async as items">
              <div
                *ngFor="let item of items"
                class="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3"
              >
                <div
                  class="mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center"
                  [ngClass]="{
                    'bg-blue-500/10': (item.severity ?? 'info') === 'info',
                    'bg-green-500/10': (item.severity ?? 'info') === 'success',
                    'bg-amber-500/10': (item.severity ?? 'info') === 'warn',
                    'bg-red-500/10': (item.severity ?? 'info') === 'error'
                  }"
                >
                  <i
                    class="pi"
                    [class.pi-info-circle]="(item.severity ?? 'info') === 'info'"
                    [class.pi-check-circle]="(item.severity ?? 'info') === 'success'"
                    [class.pi-exclamation-triangle]="(item.severity ?? 'info') === 'warn'"
                    [class.pi-times-circle]="(item.severity ?? 'info') === 'error'"
                    [class.text-blue-600]="(item.severity ?? 'info') === 'info'"
                    [class.text-green-700]="(item.severity ?? 'info') === 'success'"
                    [class.text-amber-700]="(item.severity ?? 'info') === 'warn'"
                    [class.text-red-700]="(item.severity ?? 'info') === 'error'"
                  ></i>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <div class="truncate text-sm font-semibold text-gray-900">{{ item.title }}</div>
                    <div class="text-xs text-gray-500">{{ item.ts | date: 'short' }}</div>
                  </div>

                  <div *ngIf="item.detail" class="mt-1 text-sm text-gray-600">
                    {{ item.detail }}
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <div class="lg:col-span-1 space-y-4">
          <p-card>
            <ng-template pTemplate="title">Next steps</ng-template>
            <p class="text-sm text-gray-600">
              Update runtime configuration via settings, then confirm the Healthcheck card turns green.
            </p>

            <div class="mt-4 grid gap-2">
              <a routerLink="/settings">
                <button
                  pButton
                  type="button"
                  icon="pi pi-sliders-h"
                  label="Open settings"
                  class="w-full p-button"
                  [style.background]="'var(--ocean-primary)'"
                  [style.borderColor]="'var(--ocean-primary)'"
                ></button>
              </a>

              <a class="text-sm text-gray-600 hover:text-gray-900 underline" href="https://primeng.org/" target="_blank" rel="noreferrer">
                PrimeNG docs
              </a>
            </div>
          </p-card>

          <p-card>
            <ng-template pTemplate="title">Data flow</ng-template>
            <p class="text-sm text-gray-600">
              Dashboard uses <span class="font-mono text-xs">ApiClientService</span> which reads
              <span class="font-mono text-xs">NG_APP_*</span> variables (SSR-safe).
            </p>
          </p-card>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(ApiClientService);

  protected status$: Observable<DashboardStatus> = this.api.getDashboardStatus$();
  protected activity$: Observable<ActivityItem[]> = this.api.getActivity$();

  protected refresh(): void {
    // Force new Observables so async pipe re-subscribes.
    this.status$ = this.api.getDashboardStatus$();
    this.activity$ = this.api.getActivity$();
  }
}
