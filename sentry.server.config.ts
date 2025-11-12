/**
 * Sentry Server Configuration
 * 
 * Error tracking for server-side errors (API routes, server components)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Enable only in production or if explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out known errors
  beforeSend(event, hint) {
    // Don't send events for expected business logic errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;
      // Filter out validation errors that are handled
      if (message.includes('Validation error') || message.includes('Not found')) {
        return null;
      }
    }
    return event;
  },

  // Environment
  environment: process.env.NODE_ENV,
});
