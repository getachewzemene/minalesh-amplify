/**
 * API Middleware Utilities
 * Request/response tracking and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordHealthMetric } from './monitoring';
import { trackMetric } from './apm';

/**
 * Track API response time for a request
 */
export async function trackApiResponseTime(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const path = req.nextUrl.pathname;
  const method = req.method || 'GET';
  
  let status = 200;
  let error = false;
  
  try {
    const response = await handler();
    status = response.status;
    
    return response;
  } catch (err) {
    error = true;
    status = 500;
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    
    // Track in APM
    trackMetric('api.response_time', duration, {
      path,
      method,
      status: String(status),
      error: error ? '1' : '0',
    });
    
    // Record in database if it's slow or an error
    if (duration > 1000 || error) {
      try {
        await recordHealthMetric('api_response_time_ms', duration, {
          unit: 'ms',
          threshold: 1000,
          metadata: {
            path,
            method,
            status,
            error,
          },
        });
      } catch (recordError) {
        console.error('Failed to record API response time metric:', recordError);
      }
    }
  }
}

/**
 * Wrapper to add response time tracking to API routes
 * Usage in route.ts:
 * 
 * export async function GET(req: NextRequest) {
 *   return withResponseTimeTracking(req, async () => {
 *     // Your handler code here
 *     return NextResponse.json({ data: ... });
 *   });
 * }
 */
export async function withResponseTimeTracking(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return trackApiResponseTime(req, handler);
}
