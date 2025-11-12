/**
 * Structured Logging Utility
 * 
 * Provides centralized logging with different log levels and structured output.
 * Uses pino for high-performance JSON logging.
 */

import pino from 'pino';

// Configure logger based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

/**
 * Log levels:
 * - trace: Most detailed, for debugging
 * - debug: Debug information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Critical errors
 */

export interface LogContext {
  [key: string]: any;
}

export interface ApiLogContext extends LogContext {
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  error?: Error | string;
}

/**
 * Log an API request
 */
export function logApiRequest(context: ApiLogContext) {
  const { method, path, statusCode, duration, userId, ...rest } = context;
  
  const logData = {
    type: 'api_request',
    method,
    path,
    statusCode,
    duration,
    userId,
    ...rest,
  };

  if (statusCode && statusCode >= 500) {
    logger.error(logData, `API Error: ${method} ${path}`);
  } else if (statusCode && statusCode >= 400) {
    logger.warn(logData, `API Warning: ${method} ${path}`);
  } else {
    logger.info(logData, `API Request: ${method} ${path}`);
  }
}

/**
 * Log an error with context
 */
export function logError(error: Error | string, context?: LogContext) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error(
    {
      type: 'error',
      error: errorMessage,
      stack: errorStack,
      ...context,
    },
    `Error: ${errorMessage}`
  );
}

/**
 * Log application events
 */
export function logEvent(event: string, context?: LogContext) {
  logger.info(
    {
      type: 'event',
      event,
      ...context,
    },
    `Event: ${event}`
  );
}

/**
 * Log performance metrics
 */
export function logMetric(metric: string, value: number, context?: LogContext) {
  logger.info(
    {
      type: 'metric',
      metric,
      value,
      ...context,
    },
    `Metric: ${metric} = ${value}`
  );
}

/**
 * Log database queries for monitoring
 */
export function logDatabaseQuery(query: string, duration: number, context?: LogContext) {
  logger.debug(
    {
      type: 'db_query',
      query,
      duration,
      ...context,
    },
    `DB Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`
  );
}

/**
 * Log cache operations
 */
export function logCache(operation: 'hit' | 'miss' | 'set' | 'invalidate', key: string, context?: LogContext) {
  logger.debug(
    {
      type: 'cache',
      operation,
      key,
      ...context,
    },
    `Cache ${operation}: ${key}`
  );
}

// Export the base logger for custom use
export default logger;
