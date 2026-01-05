/**
 * Minimal environment helper.
 * Reads NG_APP_* variables that are injected at runtime/build-time by the platform.
 */

export type AppEnvironment = Readonly<{
  apiBase: string;
  backendUrl: string;
  frontendUrl: string;
  wsUrl: string;
  nodeEnv: string;
  logLevel: string;
  healthcheckPath: string;
  featureFlagsRaw: string;
  experimentsEnabled: boolean;
}>;

// PUBLIC_INTERFACE
export function getAppEnvironment(): AppEnvironment {
  /** This is a public function. */
  // The platform provides these as real environment variables.
  // We intentionally read via globalThis/process so the code works in both browser and SSR contexts.
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

  const bool = (v: string | undefined) => (v ?? '').toLowerCase() === 'true';

  return {
    apiBase: env['NG_APP_API_BASE'] ?? '',
    backendUrl: env['NG_APP_BACKEND_URL'] ?? '',
    frontendUrl: env['NG_APP_FRONTEND_URL'] ?? '',
    wsUrl: env['NG_APP_WS_URL'] ?? '',
    nodeEnv: env['NG_APP_NODE_ENV'] ?? 'development',
    logLevel: env['NG_APP_LOG_LEVEL'] ?? 'info',
    healthcheckPath: env['NG_APP_HEALTHCHECK_PATH'] ?? '/healthz',
    featureFlagsRaw: env['NG_APP_FEATURE_FLAGS'] ?? '{}',
    experimentsEnabled: bool(env['NG_APP_EXPERIMENTS_ENABLED']),
  };
}
