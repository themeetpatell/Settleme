// SettleMe — Sentry init shim.
//
// Lazy-imports @sentry/react-native only if EXPO_PUBLIC_SENTRY_DSN is set AND
// the package is installed. Keeps the app runnable without Sentry installed.

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  void (async () => {
    try {
      // @ts-ignore — package is optional; declared in package.json on adoption.
      const mod = (await import('@sentry/react-native').catch(() => null)) as
        | { init?: (opts: Record<string, unknown>) => void }
        | null;
      mod?.init?.({
        dsn,
        enableAutoPerformanceTracing: true,
        tracesSampleRate: 0.1,
      });
    } catch {
      // Sentry is optional; never block app startup.
    }
  })();
}
