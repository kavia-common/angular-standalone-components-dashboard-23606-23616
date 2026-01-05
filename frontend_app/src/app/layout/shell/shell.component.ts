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
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 rounded-xl bg-[var(--ocean-primary)]/15 flex items-center justify-center">
              <i class="pi pi-compass text-[var(--ocean-primary)]"></i>
            </div>
            <div class="leading-tight">
              <div class="text-sm font-semibold">Ocean Professional</div>
              <div class="text-xs text-gray-500">Standalone Dashboard</div>
            </div>
          </div>
        </div>

        <div class="p-toolbar-group-end flex items-center gap-2">
          <a
            class="text-sm text-gray-600 hover:text-gray-900"
            href="https://primeng.org/"
            target="_blank"
            rel="noreferrer"
          >
            PrimeNG
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
                class="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-700"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <i class="pi" [ngClass]="item.icon"></i>
                <span class="flex-1">{{ item.label }}</span>
                <i class="pi pi-angle-right text-xs text-gray-400 group-hover:text-gray-600"></i>
              </a>
            </nav>
          </aside>

          <main class="lg:col-span-9">
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
    { label: 'Home', icon: 'pi-home', route: '/' },
    { label: 'Settings', icon: 'pi-cog', route: '/settings' },
  ];

  constructor() {
    // Keep store activeRoute in sync with router navigation.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.ui.setActiveRoute(e.urlAfterRedirects));


  }
}
