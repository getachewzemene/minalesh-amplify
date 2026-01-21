/**
 * Security Events API
 * GET /api/admin/security/events - List security events
 */

import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import { withApiLogger } from '@/lib/api-logger';
import prisma from '@/lib/prisma';

async function listEventsHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error } = await withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const ipAddress = searchParams.get('ipAddress');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true';
    }
    if (ipAddress) where.ipAddress = ipAddress;

    const [items, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.securityEvent.count({ where })
    ]);

    // Get summary statistics
    const stats = await prisma.securityEvent.groupBy({
      by: ['severity'],
      where: { resolved: false },
      _count: true
    });

    return NextResponse.json({
      items,
      stats: stats.reduce((acc, item) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    throw error;
  }
}

export const GET = withApiLogger(listEventsHandler);
