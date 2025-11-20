/**
 * Request Correlation ID Utility
 * 
 * Provides correlation IDs for tracking requests across the system.
 * Used for distributed tracing and debugging.
 */

import { randomUUID } from 'crypto';
import { headers } from 'next/headers';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Get correlation ID from request headers or generate a new one
 */
export function getCorrelationId(request: Request): string {
  const existingId = request.headers.get(CORRELATION_ID_HEADER);
  return existingId || generateCorrelationId();
}

/**
 * Get correlation ID from Next.js headers (for server components)
 */
export async function getCorrelationIdFromHeaders(): Promise<string> {
  const headersList = await headers();
  const existingId = headersList.get(CORRELATION_ID_HEADER);
  return existingId || generateCorrelationId();
}

/**
 * Add correlation ID to response headers
 */
export function addCorrelationIdToResponse(
  response: Response,
  correlationId: string
): Response {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}
