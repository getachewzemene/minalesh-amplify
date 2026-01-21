/**
 * IP Blacklist Management API
 * POST /api/admin/security/blacklist - Add IP to blacklist
 * DELETE /api/admin/security/blacklist - Remove IP from blacklist
 * GET /api/admin/security/blacklist - List blacklisted IPs
 */

import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import { withApiLogger } from '@/lib/api-logger';
import { addIpToBlacklist, removeIpFromBlacklist } from '@/lib/security';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const addBlacklistSchema = z.object({
  ipAddress: z.string().ip(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  expiresAt: z.string().datetime().optional()
});

const removeBlacklistSchema = z.object({
  ipAddress: z.string().ip()
});

async function addBlacklistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error, payload } = await withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = addBlacklistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ipAddress, reason, severity, expiresAt } = validation.data;

    await addIpToBlacklist(
      ipAddress,
      reason,
      severity,
      payload.userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({
      message: 'IP added to blacklist',
      ipAddress,
      severity
    });
  } catch (error) {
    throw error;
  }
}

async function removeBlacklistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error } = await withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = removeBlacklistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ipAddress } = validation.data;

    await removeIpFromBlacklist(ipAddress);

    return NextResponse.json({
      message: 'IP removed from blacklist',
      ipAddress
    });
  } catch (error) {
    throw error;
  }
}

async function listBlacklistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error } = await withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (severity) {
      where.severity = severity;
    }

    const [items, total] = await Promise.all([
      prisma.ipBlacklist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.ipBlacklist.count({ where })
    ]);

    return NextResponse.json({
      items,
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

export const POST = withApiLogger(addBlacklistHandler);
export const DELETE = withApiLogger(removeBlacklistHandler);
export const GET = withApiLogger(listBlacklistHandler);
