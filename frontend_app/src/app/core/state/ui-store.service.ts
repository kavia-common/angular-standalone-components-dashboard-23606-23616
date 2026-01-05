import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Simple UI store implemented with RxJS.
 * Keeps layout-related state outside components (useful for micro-frontends too).
 */
@Injectable({ providedIn: 'root' })
export class UiStoreService {
  private readonly _sidebarOpen$ = new BehaviorSubject<boolean>(true);
  private readonly _activeRoute$ = new BehaviorSubject<string>('/');

  /** Observable for sidebar open state. */
  get sidebarOpen$(): Observable<boolean> {
    return this._sidebarOpen$.asObservable();
  }

  /** Observable for the active route (for menu highlighting). */
  get activeRoute$(): Observable<string> {
    return this._activeRoute$.asObservable();
  }

  // PUBLIC_INTERFACE
  setSidebarOpen(open: boolean): void {
    /** This is a public function. */
    this._sidebarOpen$.next(open);
  }

  // PUBLIC_INTERFACE
  toggleSidebar(): void {
    /** This is a public function. */
    this._sidebarOpen$.next(!this._sidebarOpen$.value);
  }

  // PUBLIC_INTERFACE
  setActiveRoute(route: string): void {
    /** This is a public function. */
    this._activeRoute$.next(route);
  }
}
