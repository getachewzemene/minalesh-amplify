import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * @swagger
 * /api/beta/feedback:
 *   get:
 *     summary: Get beta feedback submissions
 *     description: Get all beta feedback (admin only) or user's own feedback
 *     tags: [Beta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, under_review, planned, in_progress, completed, rejected]
 *         description: Filter by feedback status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [bug, feature_request, improvement, usability, performance, other]
 *         description: Filter by feedback type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: List of feedback
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    const isAdmin = user?.role === 'admin';

    // Build filter
    const where: any = {};
    
    if (!isAdmin) {
      // Regular users can only see their own feedback
      where.userId = payload.userId;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const feedback = await prisma.betaFeedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching beta feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching feedback' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/beta/feedback:
 *   post:
 *     summary: Submit beta feedback
 *     description: Submit feedback about the beta version
 *     tags: [Beta]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [bug, feature_request, improvement, usability, performance, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               page:
 *                 type: string
 *               screenshot:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid input
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, priority, title, description, page, screenshot, email } = body;

    // Validation
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Type, title, and description are required' },
        { status: 400 }
      );
    }

    const validTypes = ['bug', 'feature_request', 'improvement', 'usability', 'performance', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Get user info if authenticated (optional for feedback)
    let userId = null;
    const token = getTokenFromRequest(request);
    if (token) {
      const payload = getUserFromToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    // Get user agent for debugging
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create feedback
    const feedback = await prisma.betaFeedback.create({
      data: {
        userId,
        type,
        priority: priority || 'medium',
        title,
        description,
        page,
        screenshot,
        email,
        userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          headers: {
            referer: request.headers.get('referer'),
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Feedback submitted successfully', id: feedback.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting beta feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while submitting feedback' },
      { status: 500 }
    );
  }
}
