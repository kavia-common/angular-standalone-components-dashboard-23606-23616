import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

import { UiStoreService } from '../../core/state/ui-store.service';

type NavItem = {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToolbarModule, ButtonModule],
  template: `
    <div class="min-h-screen bg-[var(--ocean-bg)]">
      <p-toolbar class="border-0 bg-[var(--ocean-surface)] shadow-soft">
        <div class="p-toolbar-group-start flex items-center gap-2">
          <button
            pButton
            type="button"
            class="p-button-text"
            icon="pi pi-bars"
            (click)="ui.toggleSidebar()"
            aria-label="Toggle sidebar"
          ></button>

          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-2xl bg-[var(--ocean-primary)]/15 flex items-center justify-center">
              <i class="pi pi-compass text-[var(--ocean-primary)]"></i>
            </div>
            <div class="leading-tight">
              <div class="text-sm font-semibold text-gray-900">Ocean Professional</div>
              <div class="text-xs text-gray-500">Standalone Dashboard</div>
            </div>
          </div>
        </div>

        <div class="p-toolbar-group-end flex items-center gap-2">
          <a
            class="hidden sm:inline text-sm text-gray-600 hover:text-gray-900"
            href="https://primeng.org/"
            target="_blank"
            rel="noreferrer"
          >
            PrimeNG
          </a>

          <a routerLink="/settings">
            <button
              pButton
              type="button"
              icon="pi pi-cog"
              label="Settings"
              class="p-button-outlined"
              aria-label="Open settings"
              [style.borderColor]="'color-mix(in srgb, var(--ocean-primary) 30%, white)'"
            ></button>
          </a>
        </div>
      </p-toolbar>

      <div class="mx-auto max-w-7xl px-4 py-6">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside
            class="lg:col-span-3 rounded-2xl bg-[var(--ocean-surface)] shadow-soft transition-all"
            [class.hidden]="!(sidebarOpen | async)"
            [class.lg:block]="true"
          >
            <nav class="p-3">
              <div class="px-3 py-2 text-xs font-semibold text-gray-500">Navigation</div>

              <a
                *ngFor="let item of nav"
                class="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                [routerLink]="item.route"
                routerLinkActive="bg-[color-mix(in_srgb,var(--ocean-primary)_10%,white)] text-[var(--ocean-primary)]"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              >
                <i class="pi" [ngClass]="item.icon"></i>
                <span class="flex-1">{{ item.label }}</span>
                <i class="pi pi-angle-right text-xs text-gray-400 group-hover:text-gray-600"></i>
              </a>

              <div class="mt-3 px-3 py-2 text-xs font-semibold text-gray-500">Quick actions</div>
              <a routerLink="/settings" class="block px-1 pb-1">
                <button
                  pButton
                  type="button"
                  label="Configure environment"
                  icon="pi pi-sliders-h"
                  class="w-full p-button"
                  [style.background]="'var(--ocean-primary)'"
                  [style.borderColor]="'var(--ocean-primary)'"
                ></button>
              </a>

              <div class="mt-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-gray-50 p-3">
                <div class="text-xs font-semibold text-gray-700">Tip</div>
                <div class="mt-1 text-xs text-gray-600">
                  Set <span class="font-mono">NG_APP_API_BASE</span> to enable live health/activity cards.
                </div>
              </div>
            </nav>
          </aside>

          <main class="lg:col-span-9 space-y-4">
            <div class="rounded-2xl bg-[var(--ocean-surface)] p-5 shadow-soft">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly ui = inject(UiStoreService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = this.ui.sidebarOpen$;

  protected readonly nav: NavItem[] = [
    { label: 'Home', icon: 'pi-home', route: '/', exact: true },
    { label: 'Settings', icon: 'pi-cog', route: '/settings', exact: true },
  ];

  constructor() {
    // Keep store activeRoute in sync with router navigation.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.ui.setActiveRoute(e.urlAfterRedirects));
  }
}
