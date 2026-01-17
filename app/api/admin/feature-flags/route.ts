/**
 * Feature Flags API
 * Admin endpoint for managing feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  getAllFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  toggleFeatureFlag,
  setRolloutPercentage,
  addTargetUsers,
  removeTargetUsers,
  getUserFeatureFlags,
} from '@/lib/feature-flags';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/feature-flags
 * Get all feature flags or check specific flag status
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
    const key = searchParams.get('key');
    const action = searchParams.get('action');

    if (action === 'user-flags') {
      // Get flags enabled for current user
      const flags = await getUserFeatureFlags({
        userId: user.userId,
        userRole: user.role,
        email: user.email,
      });
      return NextResponse.json({
        success: true,
        flags,
      });
    }

    if (key) {
      const flag = await getFeatureFlag(key);
      if (!flag) {
        return NextResponse.json(
          { error: 'Feature flag not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        flag,
      });
    }

    const flags = await getAllFeatureFlags();
    return NextResponse.json({
      success: true,
      flags,
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Create new feature flag or perform actions
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
    const { action, key, ...data } = body;

    switch (action) {
      case 'toggle':
        if (!key) {
          return NextResponse.json(
            { error: 'Feature flag key required' },
            { status: 400 }
          );
        }
        const toggled = await toggleFeatureFlag(key);
        return NextResponse.json({
          success: true,
          message: `Feature flag ${toggled.isEnabled ? 'enabled' : 'disabled'}`,
          flag: toggled,
        });

      case 'set-percentage':
        if (!key || data.percentage === undefined) {
          return NextResponse.json(
            { error: 'Key and percentage required' },
            { status: 400 }
          );
        }
        const updated = await setRolloutPercentage(key, data.percentage);
        return NextResponse.json({
          success: true,
          message: `Rollout percentage set to ${data.percentage}%`,
          flag: updated,
        });

      case 'add-users':
        if (!key || !data.userIds || !Array.isArray(data.userIds)) {
          return NextResponse.json(
            { error: 'Key and userIds array required' },
            { status: 400 }
          );
        }
        const withUsers = await addTargetUsers(key, data.userIds);
        return NextResponse.json({
          success: true,
          message: 'Target users added',
          flag: withUsers,
        });

      case 'remove-users':
        if (!key || !data.userIds || !Array.isArray(data.userIds)) {
          return NextResponse.json(
            { error: 'Key and userIds array required' },
            { status: 400 }
          );
        }
        const withoutUsers = await removeTargetUsers(key, data.userIds);
        return NextResponse.json({
          success: true,
          message: 'Target users removed',
          flag: withoutUsers,
        });

      case 'create':
      default:
        // Validate required fields
        if (!data.key || !data.name) {
          return NextResponse.json(
            { error: 'Key and name are required' },
            { status: 400 }
          );
        }

        // Check for existing flag
        const existing = await getFeatureFlag(data.key);
        if (existing) {
          return NextResponse.json(
            { error: 'Feature flag with this key already exists' },
            { status: 400 }
          );
        }

        const flag = await createFeatureFlag(data);
        return NextResponse.json({
          success: true,
          message: 'Feature flag created',
          flag,
        });
    }
  } catch (error) {
    console.error('Error processing feature flag action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feature-flags
 * Update feature flag
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
    const { key, ...updates } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key required' },
        { status: 400 }
      );
    }

    const flag = await updateFeatureFlag(key, updates);

    return NextResponse.json({
      success: true,
      message: 'Feature flag updated',
      flag,
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feature-flags
 * Delete feature flag
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
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Feature flag key required' },
        { status: 400 }
      );
    }

    await deleteFeatureFlag(key);

    return NextResponse.json({
      success: true,
      message: 'Feature flag deleted',
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature flag' },
      { status: 500 }
    );
  }
}
