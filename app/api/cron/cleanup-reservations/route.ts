import { NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/inventory';

/**
 * GET /api/cron/cleanup-reservations
 * 
 * Background job to clean up expired inventory reservations
 * Should be called periodically (e.g., every 5 minutes) via cron or scheduler
 * 
 * Authentication: Requires CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // In development, log warning but allow execution
      console.warn(
        'CRON_SECRET not set - cron endpoint is unprotected in production!'
      );
    }

    const cleanedCount = await cleanupExpiredReservations();

    return NextResponse.json({
      success: true,
      cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cleanup-reservations cron:', error);
    return NextResponse.json(
      { error: 'An error occurred during cleanup' },
      { status: 500 }
    );
  }
}
