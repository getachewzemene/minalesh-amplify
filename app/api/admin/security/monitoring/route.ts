import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminSecurity } from '@/lib/security-middleware';
import { withRoleCheck } from '@/lib/middleware';

/**
 * @swagger
 * /api/admin/security/monitoring:
 *   get:
 *     summary: Get security monitoring dashboard data
 *     description: Retrieve security metrics and recent events for monitoring (admin only)
 *     tags: [Admin, Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: Security monitoring data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin role required
 */
async function getMonitoringHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Calculate time window
    const timeWindows: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    const windowMs = timeWindows[timeRange] || timeWindows['24h'];
    const since = new Date(Date.now() - windowMs);
    
    // Get security events grouped by type
    const eventsByType = await prisma.securityEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: { gte: since },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
    
    // Get events grouped by severity
    const eventsBySeverity = await prisma.securityEvent.groupBy({
      by: ['severity'],
      where: {
        createdAt: { gte: since },
      },
      _count: {
        id: true,
      },
    });
    
    // Get recent high/critical severity events
    const recentCriticalEvents = await prisma.securityEvent.findMany({
      where: {
        severity: { in: ['high', 'critical'] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ipAddress: true,
        eventType: true,
        severity: true,
        userAgent: true,
        endpoint: true,
        metadata: true,
        createdAt: true,
        resolved: true,
      },
    });
    
    // Get active blacklisted IPs
    const blacklistedIPs = await prisma.ipBlacklist.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        ipAddress: true,
        reason: true,
        severity: true,
        blockCount: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { blockCount: 'desc' },
      take: 20,
    });
    
    // Get whitelisted IPs count
    const whitelistCount = await prisma.ipWhitelist.count({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    // Calculate metrics
    const totalEvents = eventsByType.reduce((sum, item) => sum + item._count.id, 0);
    const criticalCount = eventsBySeverity.find(e => e.severity === 'critical')?._count.id || 0;
    const highCount = eventsBySeverity.find(e => e.severity === 'high')?._count.id || 0;
    
    // Get rate limit violations
    const rateLimitViolations = eventsByType.find(e => e.eventType === 'rate_limit_exceeded')?._count.id || 0;
    
    // Get CSRF failures
    const csrfFailures = eventsByType.find(e => e.eventType === 'csrf_validation_failed')?._count.id || 0;
    
    // Get bot detections
    const botDetections = eventsByType.find(e => e.eventType === 'suspicious_user_agent')?._count.id || 0;
    
    return NextResponse.json({
      timeRange,
      metrics: {
        totalEvents,
        criticalEvents: criticalCount,
        highEvents: highCount,
        rateLimitViolations,
        csrfFailures,
        botDetections,
        activeBlacklist: blacklistedIPs.length,
        activeWhitelist: whitelistCount,
      },
      eventsByType: eventsByType.map(e => ({
        type: e.eventType,
        count: e._count.id,
      })),
      eventsBySeverity: eventsBySeverity.map(e => ({
        severity: e.severity,
        count: e._count.id,
      })),
      recentCriticalEvents,
      blacklistedIPs,
    });
  } catch (error) {
    console.error('Error fetching security monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

// Apply admin security and role check
export const GET = withAdminSecurity(
  withRoleCheck(getMonitoringHandler, ['admin'])
);
