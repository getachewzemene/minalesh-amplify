import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/user/data-export:
 *   post:
 *     summary: Request user data export
 *     description: Create a request to export all user data (GDPR compliance)
 *     tags: [User, Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *                 default: json
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [orders, reviews, addresses, wishlists, preferences, loyalty]
 *                 description: Specific data categories to export (empty array exports all)
 *               isRecurring:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this should be a recurring export
 *               recurringSchedule:
 *                 type: string
 *                 description: Cron expression for recurring exports (required if isRecurring is true)
 *     responses:
 *       201:
 *         description: Export request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 *   get:
 *     summary: Get data export requests
 *     description: Retrieve user's data export requests and their status
 *     tags: [User, Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of export requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */

async function createDataExportHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const format = body.format || 'json';
    const categories = body.categories || []; // Specific categories to export
    const isRecurring = body.isRecurring || false;
    const recurringSchedule = body.recurringSchedule; // e.g., "0 0 * * 0" for weekly

    if (!['json', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json, csv, or pdf' },
        { status: 400 }
      );
    }

    // Validate categories if provided
    const validCategories = ['orders', 'reviews', 'addresses', 'wishlists', 'preferences', 'loyalty'];
    if (categories.length > 0) {
      const invalidCategories = categories.filter((c: string) => !validCategories.includes(c));
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { error: `Invalid categories: ${invalidCategories.join(', ')}. Valid categories are: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate recurring schedule if provided
    if (isRecurring && !recurringSchedule) {
      return NextResponse.json(
        { error: 'Recurring schedule is required for recurring exports' },
        { status: 400 }
      );
    }

    // Check for existing pending/processing requests (only for non-recurring)
    if (!isRecurring) {
      const existingRequest = await prisma.dataExportRequest.findFirst({
        where: {
          userId: user.userId,
          status: {
            in: ['pending', 'processing'],
          },
          isRecurring: false,
        },
      });

      if (existingRequest) {
        return NextResponse.json(
          {
            error: 'You already have a pending export request',
            requestId: existingRequest.id,
          },
          { status: 429 }
        );
      }
    }

    // Create new export request
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Calculate next run time for recurring exports
    let nextRunAt: Date | undefined;
    if (isRecurring && recurringSchedule) {
      // TODO: Use proper cron parser to calculate next run time
      // For now, schedule for next day at the same time
      nextRunAt = new Date();
      nextRunAt.setDate(nextRunAt.getDate() + 1);
    }

    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId: user.userId,
        format,
        categories,
        isRecurring,
        recurringSchedule,
        nextRunAt,
        status: 'pending',
        expiresAt,
      },
    });

    // TODO: Trigger background job to process the export
    // This would be handled by a cron job or background worker

    return NextResponse.json(
      {
        message: isRecurring 
          ? 'Recurring data export scheduled successfully. You will receive emails when your data is ready.'
          : 'Data export request created successfully. You will receive an email when your data is ready.',
        requestId: exportRequest.id,
        status: exportRequest.status,
        isRecurring,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating data export request:', error);
    throw error;
  }
}

async function getDataExportRequestsHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.dataExportRequest.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        format: true,
        downloadUrl: true,
        fileSize: true,
        expiresAt: true,
        completedAt: true,
        failedAt: true,
        failureReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching data export requests:', error);
    throw error;
  }
}

export const POST = withApiLogger(createDataExportHandler);
export const GET = withApiLogger(getDataExportRequestsHandler);
