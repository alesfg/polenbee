import * as Sentry from '@sentry/react-native';

// Crash/error reporting. Stays off until EXPO_PUBLIC_SENTRY_DSN is set (EAS env or .env.local).
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = !!dsn;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    // Photos and locations are user data: don't attach IPs or request bodies by default.
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

/** Wraps the root component so render crashes are reported (no-op without a DSN). */
export function withSentry<P extends Record<string, unknown>>(component: React.ComponentType<P>): React.ComponentType<P> {
  return dsn ? Sentry.wrap(component) : component;
}
