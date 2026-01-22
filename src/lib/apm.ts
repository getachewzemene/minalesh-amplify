/**
 * Application Performance Monitoring (APM) Integration
 * Supports New Relic and Datadog for comprehensive application monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * APM Provider type
 */
export type APMProvider = 'newrelic' | 'datadog' | 'sentry' | 'none';

/**
 * Get the configured APM provider
 * Priority: New Relic > Datadog > Sentry > None
 * 
 * Environment variables:
 * - NEW_RELIC_LICENSE_KEY for New Relic
 * - DATADOG_API_KEY or DD_API_KEY for Datadog (DD_API_KEY preferred)
 * - SENTRY_DSN for Sentry
 */
export function getAPMProvider(): APMProvider {
  if (process.env.NEW_RELIC_LICENSE_KEY) return 'newrelic';
  // Prefer DD_API_KEY over DATADOG_API_KEY for consistency
  if (process.env.DD_API_KEY || process.env.DATADOG_API_KEY) return 'datadog';
  if (process.env.SENTRY_DSN) return 'sentry';
  return 'none';
}

/**
 * Track a custom metric across APM providers
 */
export function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string | number>
) {
  const provider = getAPMProvider();

  switch (provider) {
    case 'newrelic':
      trackNewRelicMetric(name, value, tags);
      break;
    case 'datadog':
      trackDatadogMetric(name, value, tags);
      break;
    case 'sentry':
      // Sentry doesn't have direct metric tracking in the way other APMs do
      // You can use custom measurements or breadcrumbs
      if (tags) {
        Sentry.setContext('metrics', { ...tags, [name]: value });
      }
      break;
    default:
      // No APM configured, log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[APM Metric] ${name}: ${value}`, tags);
      }
  }
}

/**
 * Track a custom event across APM providers
 */
export function trackEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
) {
  const provider = getAPMProvider();

  switch (provider) {
    case 'newrelic':
      trackNewRelicEvent(name, attributes);
      break;
    case 'datadog':
      trackDatadogEvent(name, attributes);
      break;
    case 'sentry':
      Sentry.captureMessage(name, {
        level: 'info',
        extra: attributes,
      });
      break;
    default:
      if (process.env.NODE_ENV === 'development') {
        console.log(`[APM Event] ${name}`, attributes);
      }
  }
}

/**
 * Track an error across APM providers
 */
export function trackError(
  error: Error,
  context?: Record<string, unknown>
) {
  const provider = getAPMProvider();

  switch (provider) {
    case 'newrelic':
      trackNewRelicError(error, context);
      break;
    case 'datadog':
      trackDatadogError(error, context);
      break;
    case 'sentry':
      Sentry.captureException(error, {
        extra: context,
      });
      break;
    default:
      console.error('[APM Error]', error, context);
  }
}

/**
 * Start a transaction/trace
 */
export function startTransaction(name: string, operation?: string) {
  const provider = getAPMProvider();

  switch (provider) {
    case 'newrelic':
      return startNewRelicTransaction(name);
    case 'datadog':
      return startDatadogTrace(name, operation);
    case 'sentry':
      // For Sentry, use spans instead of transactions
      // Transactions have been deprecated in favor of spans
      return {
        finish: () => {},
        setStatus: () => {},
        setData: (key: string, value: any) => {
          Sentry.setContext(key, value);
        },
      };
    default:
      // Return a mock transaction for consistency
      return {
        finish: () => {},
        setStatus: () => {},
        setData: () => {},
      };
  }
}

// New Relic integration functions
function trackNewRelicMetric(
  name: string,
  value: number,
  tags?: Record<string, string | number>
) {
  try {
    // New Relic uses a global `newrelic` object when the agent is installed
    const newrelic = (global as any).newrelic;
    if (newrelic) {
      newrelic.recordMetric(name, value);
      
      if (tags) {
        newrelic.addCustomAttributes(tags);
      }
    }
  } catch (error) {
    console.warn('Failed to track New Relic metric:', error);
  }
}

function trackNewRelicEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
) {
  try {
    const newrelic = (global as any).newrelic;
    if (newrelic) {
      newrelic.recordCustomEvent(name, attributes || {});
    }
  } catch (error) {
    console.warn('Failed to track New Relic event:', error);
  }
}

function trackNewRelicError(error: Error, context?: Record<string, unknown>) {
  try {
    const newrelic = (global as any).newrelic;
    if (newrelic) {
      newrelic.noticeError(error, context);
    }
  } catch (err) {
    console.warn('Failed to track New Relic error:', err);
  }
}

function startNewRelicTransaction(name: string) {
  try {
    const newrelic = (global as any).newrelic;
    if (newrelic) {
      return newrelic.startWebTransaction(name, () => {
        return {
          finish: () => newrelic.endTransaction(),
          setStatus: () => {},
          setData: (key: string, value: any) => {
            newrelic.addCustomAttribute(key, value);
          },
        };
      });
    }
  } catch (error) {
    console.warn('Failed to start New Relic transaction:', error);
  }
  
  return { finish: () => {}, setStatus: () => {}, setData: () => {} };
}

// Datadog integration functions
function trackDatadogMetric(
  name: string,
  value: number,
  tags?: Record<string, string | number>
) {
  try {
    // Datadog integration requires the dd-trace or dogstatsd library
    // This is a placeholder that should be replaced with actual Datadog client
    const tracer = (global as any).tracer;
    if (tracer && tracer.dogstatsd) {
      // Use DogStatsD client if available
      const tagArray = tags
        ? Object.entries(tags).map(([k, v]) => `${k}:${v}`)
        : [];
      tracer.dogstatsd.gauge(name, value, tagArray);
    } else if (process.env.NODE_ENV === 'development') {
      // Only log in development
      const tagArray = tags
        ? Object.entries(tags).map(([k, v]) => `${k}:${v}`)
        : [];
      console.log(`[Datadog Metric] ${name}: ${value}`, tagArray);
    }
  } catch (error) {
    console.warn('Failed to track Datadog metric:', error);
  }
}

function trackDatadogEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
) {
  try {
    const tracer = (global as any).tracer;
    if (tracer) {
      console.log(`[Datadog Event] ${name}`, attributes);
    }
  } catch (error) {
    console.warn('Failed to track Datadog event:', error);
  }
}

function trackDatadogError(error: Error, context?: Record<string, unknown>) {
  try {
    const tracer = (global as any).tracer;
    if (tracer && tracer.scope) {
      const span = tracer.scope().active();
      if (span) {
        span.setTag('error', true);
        span.setTag('error.message', error.message);
        span.setTag('error.stack', error.stack);
        
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            span.setTag(`error.${key}`, value);
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to track Datadog error:', err);
  }
}

function startDatadogTrace(name: string, operation?: string) {
  try {
    const tracer = (global as any).tracer;
    if (tracer) {
      const span = tracer.startSpan(operation || name, {
        resource: name,
      });
      
      return {
        finish: () => span.finish(),
        setStatus: (status: string) => {
          span.setTag('http.status_code', status);
        },
        setData: (key: string, value: any) => {
          span.setTag(key, value);
        },
      };
    }
  } catch (error) {
    console.warn('Failed to start Datadog trace:', error);
  }
  
  return { finish: () => {}, setStatus: () => {}, setData: () => {} };
}

/**
 * Middleware helper to track API response times
 */
export function createAPMMiddleware() {
  return async (
    handler: (req: any, res: any) => Promise<any>,
    req: any,
    res: any
  ) => {
    const startTime = Date.now();
    const path = req.url || 'unknown';
    const method = req.method || 'GET';
    
    const transaction = startTransaction(`${method} ${path}`, 'http.server');
    
    try {
      const result = await handler(req, res);
      
      const duration = Date.now() - startTime;
      
      // Track response time metric
      trackMetric('api.response_time', duration, {
        path,
        method,
        status: res.status || 200,
      });
      
      transaction.setStatus('ok');
      transaction.finish();
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackMetric('api.response_time', duration, {
        path,
        method,
        status: res.status || 500,
        error: true,
      });
      
      trackError(error as Error, { path, method });
      
      transaction.setStatus('error');
      transaction.finish();
      
      throw error;
    }
  };
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  success: boolean
) {
  trackMetric('db.query.duration', duration, {
    query: query.substring(0, 100), // Truncate for readability
    success: success ? 1 : 0,
  });
  
  if (!success) {
    trackEvent('db.query.failed', {
      query: query.substring(0, 200),
    });
  }
}
