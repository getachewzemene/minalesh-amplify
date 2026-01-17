/**
 * Alert Management API
 * Admin endpoint for managing alerts and alert configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getAlertConfigs,
  createAlertConfig,
  updateAlertConfig,
  deleteAlertConfig,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
} from '@/lib/monitoring';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/monitoring/alerts
 * Get alert configurations and history
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
    const configId = searchParams.get('configId');
    const severity = searchParams.get('severity');
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    switch (action) {
      case 'configs':
        const configs = await getAlertConfigs();
        return NextResponse.json({
          success: true,
          configs,
        });

      case 'history':
        const history = await getAlertHistory(
          {
            alertConfigId: configId || undefined,
            severity: severity || undefined,
            days,
          },
          limit
        );
        return NextResponse.json({
          success: true,
          history,
        });

      default:
        // Return both configs and recent history
        const [allConfigs, recentHistory] = await Promise.all([
          getAlertConfigs(),
          getAlertHistory({ days: 7 }, 50),
        ]);
        return NextResponse.json({
          success: true,
          configs: allConfigs,
          recentHistory,
        });
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monitoring/alerts
 * Create new alert configuration or perform alert actions
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
    const { action, alertId, ...configData } = body;

    switch (action) {
      case 'acknowledge':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          );
        }
        const acknowledged = await acknowledgeAlert(alertId, user.userId);
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged',
          alert: acknowledged,
        });

      case 'resolve':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          );
        }
        const resolved = await resolveAlert(alertId);
        return NextResponse.json({
          success: true,
          message: 'Alert resolved',
          alert: resolved,
        });

      case 'create':
      default:
        // Validate required fields
        if (!configData.name || !configData.metricType || !configData.condition || configData.threshold === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: name, metricType, condition, threshold' },
            { status: 400 }
          );
        }

        // Validate condition
        const validConditions = ['gt', 'lt', 'eq', 'gte', 'lte'];
        if (!validConditions.includes(configData.condition)) {
          return NextResponse.json(
            { error: 'Invalid condition. Use: gt, lt, eq, gte, lte' },
            { status: 400 }
          );
        }

        const config = await createAlertConfig(configData);
        return NextResponse.json({
          success: true,
          message: 'Alert configuration created',
          config,
        });
    }
  } catch (error) {
    console.error('Error processing alert action:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/monitoring/alerts
 * Update alert configuration
 */
export async function PUT(req: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Alert config ID required' },
        { status: 400 }
      );
    }

    const config = await updateAlertConfig(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Alert configuration updated',
      config,
    });
  } catch (error) {
    console.error('Error updating alert config:', error);
    return NextResponse.json(
      { error: 'Failed to update alert configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/monitoring/alerts
 * Delete alert configuration
 */
export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Alert config ID required' },
        { status: 400 }
      );
    }

    await deleteAlertConfig(id);

    return NextResponse.json({
      success: true,
      message: 'Alert configuration deleted',
    });
  } catch (error) {
    console.error('Error deleting alert config:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert configuration' },
      { status: 500 }
    );
  }
}
