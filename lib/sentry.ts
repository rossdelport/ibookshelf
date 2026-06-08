import * as Sentry from '@sentry/react-native';

// Crash + error reporting. Inert until EXPO_PUBLIC_SENTRY_DSN is set (so the app
// runs fine locally / before a Sentry project exists); once a DSN is provided in
// eas.json env or .env, production crashes and unhandled rejections are reported.

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = !!dsn;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2, // modest performance sampling
    sendDefaultPii: false, // don't attach user IP / personal data
  });
}

// Report a caught error (used by the root error boundary and anywhere we catch).
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
    if (__DEV__) console.warn('[captureError]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
