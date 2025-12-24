import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/user/activity:
 *   post:
 *     summary: Track user activity
 *     description: Track user activity events such as product views, searches, etc.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [product_view, search, add_to_cart, add_to_wishlist, purchase]
 *               eventData:
 *                 type: object
 *                 description: Event-specific data (productId, searchQuery, etc.)
 *     responses:
 *       200:
 *         description: Activity tracked successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
async function handler(request: Request) {
  const token = getTokenFromRequest(request);
  const payload = token ? getUserFromToken(token) : null;
  const userId = payload?.userId;

  const body = await request.json();
  const { eventType, eventData } = body;

  if (!eventType) {
    return NextResponse.json(
      { error: 'Event type is required' },
      { status: 400 }
    );
  }

  try {
    // Get session ID from cookie or generate one for anonymous users
    const sessionId = request.headers.get('x-session-id') || crypto.randomUUID();

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: userId || null,
        sessionId,
        eventType,
        eventData: eventData || {},
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Activity tracked successfully',
      sessionId 
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    );
  }
}

export const POST = withApiLogger(handler);

/**
 * @swagger
 * /api/user/activity:
 *   get:
 *     summary: Get user activity history
 *     description: Get recent activity events for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of events to return
 *     responses:
 *       200:
 *         description: User activity history
 *       401:
 *         description: Unauthorized
 */
async function getHandler(request: Request) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = getUserFromToken(token);
  const userId = payload?.userId;

  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('eventType');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        ...(eventType && { eventType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export const GET = withApiLogger(getHandler);
