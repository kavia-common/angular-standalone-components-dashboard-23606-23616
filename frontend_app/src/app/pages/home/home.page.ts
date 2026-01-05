import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { getAppEnvironment } from '../../core/environment';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl bg-gradient-to-r from-blue-500/10 to-gray-50 p-6 shadow-soft">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight">Ocean Professional Dashboard</h1>
            <p class="mt-1 text-sm text-gray-600">
              Standalone components • RxJS state • Reactive Forms • PrimeNG + Tailwind
            </p>
          </div>

          <p-tag severity="info" [value]="'ENV: ' + env.nodeEnv"></p-tag>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <p-card>
          <ng-template pTemplate="title">Primary</ng-template>
          <p class="text-sm text-gray-600">Ocean primary accent</p>
          <div class="mt-4 flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-[var(--ocean-primary)]"></span>
            <span class="font-mono text-xs text-gray-700">#2563EB</span>
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">Secondary</ng-template>
          <p class="text-sm text-gray-600">Amber highlight accent</p>
          <div class="mt-4 flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-[var(--ocean-secondary)]"></span>
            <span class="font-mono text-xs text-gray-700">#F59E0B</span>
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">Backend</ng-template>
          <p class="text-sm text-gray-600">Configured base URL</p>
          <div class="mt-4 rounded-lg bg-gray-50 p-2 font-mono text-xs text-gray-700">
            {{ env.backendUrl || env.apiBase || '(not set)' }}
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="title">WebSocket</ng-template>
          <p class="text-sm text-gray-600">Configured WS URL</p>
          <div class="mt-4 rounded-lg bg-gray-50 p-2 font-mono text-xs text-gray-700">
            {{ env.wsUrl || '(not set)' }}
          </div>
        </p-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly env = getAppEnvironment();
}
