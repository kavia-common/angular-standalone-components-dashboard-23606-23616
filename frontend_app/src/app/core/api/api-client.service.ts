import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { getAppEnvironment } from '../environment';

/**
 * Minimal API client wrapper.
 * This intentionally does NOT assume any backend endpoints; it only centralizes base URL usage.
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
}
