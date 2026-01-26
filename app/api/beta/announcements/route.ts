import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRead = searchParams.get('includeRead') === 'true';

    let userId = null;
    const token = getTokenFromRequest(request);
    if (token) {
      const payload = getUserFromToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    const now = new Date();

    const announcements = await prisma.featureAnnouncement.findMany({
      where: {
        publishedAt: {
          lte: now,
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: userId
        ? {
            reads: {
              where: { userId },
              select: { id: true, readAt: true },
            },
          }
        : undefined,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
    });

    const filteredAnnouncements = includeRead
      ? announcements
      : announcements.filter((a) => !a.reads || a.reads.length === 0);

    return NextResponse.json(filteredAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching announcements' },
      { status: 500 }
    );
  }
}
