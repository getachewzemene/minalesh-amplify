/**
 * Backup Management API
 * Admin endpoint for managing database backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getBackupHistory,
  getBackupStats,
  simulateBackup,
  cleanupExpiredBackups,
  getRecommendedBackupSchedule,
  verifyBackupIntegrity,
} from '@/lib/backup';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/backups
 * Get backup history and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    switch (action) {
      case 'stats':
        const stats = await getBackupStats();
        return NextResponse.json({
          success: true,
          stats: {
            ...stats,
            totalStorageUsed: stats.totalStorageUsed.toString(),
          },
        });

      case 'schedule':
        return NextResponse.json({
          success: true,
          recommendedSchedule: getRecommendedBackupSchedule(),
        });

      case 'verify':
        const backupId = searchParams.get('backupId');
        if (!backupId) {
          return NextResponse.json(
            { error: 'Backup ID required' },
            { status: 400 }
          );
        }
        const isValid = await verifyBackupIntegrity(backupId);
        return NextResponse.json({
          success: true,
          backupId,
          isValid,
        });

      default:
        // Default: get backup history
        const history = await getBackupHistory(limit);
        const backupStats = await getBackupStats();
        return NextResponse.json({
          success: true,
          backups: history.map((b) => ({
            ...b,
            size: b.size?.toString(),
          })),
          stats: {
            ...backupStats,
            totalStorageUsed: backupStats.totalStorageUsed.toString(),
          },
          recommendedSchedule: getRecommendedBackupSchedule(),
        });
    }
  } catch (error) {
    console.error('Error fetching backup data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backup data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backups
 * Create a new backup (simulated) or cleanup expired backups
 */
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, type = 'full' } = body;

    switch (action) {
      case 'create':
        // Validate backup type
        if (!['full', 'incremental', 'differential'].includes(type)) {
          return NextResponse.json(
            { error: 'Invalid backup type' },
            { status: 400 }
          );
        }

        const backup = await simulateBackup(type);
        return NextResponse.json({
          success: true,
          message: `${type} backup ${backup.status === 'completed' ? 'completed' : 'failed'}`,
          backup: {
            ...backup,
            size: backup.size?.toString(),
          },
        });

      case 'cleanup':
        const deletedCount = await cleanupExpiredBackups();
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${deletedCount} expired backup records`,
          deletedCount,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create or cleanup' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing backup action:', error);
    return NextResponse.json(
      { error: 'Failed to process backup action' },
      { status: 500 }
    );
  }
}
