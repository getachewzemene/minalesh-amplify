/**
 * Deployments API
 * Admin endpoint for tracking deployments and rollbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import {
  recordDeployment,
  updateDeploymentStatus,
  getDeploymentHistory,
  getLatestDeployment,
  initiateRollback,
} from '@/lib/feature-flags';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/deployments
 * Get deployment history
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
    const environment = searchParams.get('environment');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (action === 'latest') {
      if (!environment) {
        return NextResponse.json(
          { error: 'Environment required for latest deployment' },
          { status: 400 }
        );
      }
      const latest = await getLatestDeployment(environment);
      return NextResponse.json({
        success: true,
        deployment: latest,
      });
    }

    const deployments = await getDeploymentHistory(
      environment || undefined,
      limit
    );

    // Also get latest for each environment
    const [latestStaging, latestProduction] = await Promise.all([
      getLatestDeployment('staging'),
      getLatestDeployment('production'),
    ]);

    return NextResponse.json({
      success: true,
      deployments,
      latest: {
        staging: latestStaging,
        production: latestProduction,
      },
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deployments
 * Record new deployment or perform actions
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
    const { action, deploymentId, ...data } = body;

    switch (action) {
      case 'rollback':
        if (!deploymentId) {
          return NextResponse.json(
            { error: 'Deployment ID required for rollback' },
            { status: 400 }
          );
        }
        const rolledBack = await initiateRollback(deploymentId);
        return NextResponse.json({
          success: true,
          message: 'Rollback initiated',
          deployment: rolledBack,
        });

      case 'update-status':
        if (!deploymentId || !data.status) {
          return NextResponse.json(
            { error: 'Deployment ID and status required' },
            { status: 400 }
          );
        }
        const updated = await updateDeploymentStatus(
          deploymentId,
          data.status,
          {
            smokeTestPassed: data.smokeTestPassed,
            errorMessage: data.errorMessage,
            metadata: data.metadata,
          }
        );
        return NextResponse.json({
          success: true,
          message: 'Deployment status updated',
          deployment: updated,
        });

      case 'create':
      default:
        // Validate required fields
        if (!data.version || !data.environment) {
          return NextResponse.json(
            { error: 'Version and environment are required' },
            { status: 400 }
          );
        }

        // Validate environment
        if (!['staging', 'production'].includes(data.environment)) {
          return NextResponse.json(
            { error: 'Environment must be staging or production' },
            { status: 400 }
          );
        }

        const deployment = await recordDeployment({
          version: data.version,
          environment: data.environment,
          commitHash: data.commitHash,
          commitMessage: data.commitMessage,
          deployedBy: user.id,
          metadata: data.metadata,
        });

        return NextResponse.json({
          success: true,
          message: 'Deployment recorded',
          deployment,
        });
    }
  } catch (error) {
    console.error('Error processing deployment action:', error);
    const message = error instanceof Error ? error.message : 'Failed to process action';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
