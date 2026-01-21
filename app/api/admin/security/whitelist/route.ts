/**
 * IP Whitelist Management API
 * POST /api/admin/security/whitelist - Add IP to whitelist
 * DELETE /api/admin/security/whitelist - Remove IP from whitelist
 * GET /api/admin/security/whitelist - List whitelisted IPs
 */

import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware';
import { withApiLogger } from '@/lib/api-logger';
import { addIpToWhitelist, removeIpFromWhitelist } from '@/lib/security';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const addWhitelistSchema = z.object({
  ipAddress: z.string().ip(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  expiresAt: z.string().datetime().optional()
});

const removeWhitelistSchema = z.object({
  ipAddress: z.string().ip()
});

async function addWhitelistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error, payload } = await withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = addWhitelistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ipAddress, reason, expiresAt } = validation.data;

    await addIpToWhitelist(
      ipAddress,
      reason,
      payload.userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({
      message: 'IP added to whitelist',
      ipAddress
    });
  } catch (error) {
    throw error;
  }
}

async function removeWhitelistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error } = await withAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = removeWhitelistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ipAddress } = validation.data;

    await removeIpFromWhitelist(ipAddress);

    return NextResponse.json({
      message: 'IP removed from whitelist',
      ipAddress
    });
  } catch (error) {
    throw error;
  }
}

async function listWhitelistHandler(request: Request): Promise<NextResponse> {
  // Check admin access
  const { error } = await withAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.ipWhitelist.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.ipWhitelist.count({ where: { isActive: true } })
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

export const POST = withApiLogger(addWhitelistHandler);
export const DELETE = withApiLogger(removeWhitelistHandler);
export const GET = withApiLogger(listWhitelistHandler);
