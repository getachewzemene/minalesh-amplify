import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Create a dispute
 *     description: File a dispute for an order (customers only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - type
 *               - description
 *             properties:
 *               orderId:
 *                 type: string
 *               orderItemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of specific order item IDs for multi-item disputes
 *               type:
 *                 type: string
 *                 enum: [not_received, not_as_described, damaged, wrong_item, refund_issue, other]
 *               description:
 *                 type: string
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               videoEvidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs to video evidence
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *       400:
 *         description: Invalid request or dispute already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *   get:
 *     summary: Get user's disputes
 *     description: Retrieve all disputes for the current user
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, pending_vendor_response, pending_admin_review, resolved, closed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of disputes
 *       401:
 *         description: Unauthorized
 */

async function createDisputeHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, orderItemIds = [], type, description, evidenceUrls = [], videoEvidenceUrls = [] } = body;

    // Validate required fields
    if (!orderId || !type || !description) {
      return NextResponse.json(
        { error: 'Order ID, type, and description are required' },
        { status: 400 }
      );
    }

    // Validate dispute type
    const validTypes = [
      'not_received',
      'not_as_described',
      'damaged',
      'wrong_item',
      'refund_issue',
      'other',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid dispute type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.userId,
      },
      include: {
        orderItems: {
          select: {
            vendorId: true,
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if order is eligible for dispute (delivered within last 30 days)
    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDelivery > 30) {
        return NextResponse.json(
          { error: 'Disputes can only be filed within 30 days of delivery' },
          { status: 400 }
        );
      }
    }

    // Check for existing open dispute
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        orderId,
        status: {
          in: ['open', 'pending_vendor_response', 'pending_admin_review'],
        },
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'An active dispute already exists for this order' },
        { status: 400 }
      );
    }

    // Get vendor ID from first order item
    const vendorId = order.orderItems[0]?.vendorId;
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Unable to determine vendor for this order' },
        { status: 500 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        orderItemIds,
        userId: user.userId,
        vendorId,
        type,
        description,
        evidenceUrls,
        videoEvidenceUrls,
        status: 'pending_vendor_response',
      },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    // Send email notifications to vendor and customer
    const [customerProfile, vendorProfile] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: user.userId },
        select: {
          displayName: true,
          user: {
            select: { email: true },
          },
        },
      }),
      prisma.profile.findUnique({
        where: { id: vendorId },
        select: {
          displayName: true,
          user: {
            select: { email: true },
          },
        },
      }),
    ]);

    if (customerProfile && vendorProfile) {
      const { queueEmail, createDisputeFiledEmail } = await import('@/lib/email');
      
      // Send notification to vendor
      const vendorEmail = createDisputeFiledEmail(
        vendorProfile.user.email,
        vendorProfile.displayName || 'Vendor',
        dispute.id,
        dispute.order.orderNumber,
        type,
        true // isVendor
      );
      await queueEmail(vendorEmail);

      // Send confirmation to customer
      const customerEmail = createDisputeFiledEmail(
        customerProfile.user.email,
        customerProfile.displayName || 'Customer',
        dispute.id,
        dispute.order.orderNumber,
        type,
        false // isVendor
      );
      await queueEmail(customerEmail);
    } else {
      // Log warning if profiles are missing
      const { logEvent } = await import('@/lib/logger');
      logEvent('dispute_filed_notification_skipped', {
        disputeId: dispute.id,
        customerProfileMissing: !customerProfile,
        vendorProfileMissing: !vendorProfile,
        message: 'Email notification skipped due to missing profile data',
      });
    }

    return NextResponse.json(
      {
        message: 'Dispute created successfully. The vendor will be notified and has 3 days to respond.',
        dispute: {
          id: dispute.id,
          type: dispute.type,
          status: dispute.status,
          orderNumber: dispute.order.orderNumber,
          createdAt: dispute.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dispute:', error);
    throw error;
  }
}

async function getDisputesHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    // Get user's profile to check if they're a vendor
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
    });

    const where: any = {};
    
    // Show disputes where user is either the customer or the vendor
    if (profile?.isVendor) {
      where.OR = [
        { userId: user.userId },
        { vendorId: profile.id },
      ];
    } else {
      where.userId = user.userId;
    }

    if (status) {
      where.status = status;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
            },
          },
          vendor: {
            select: {
              displayName: true,
            },
          },
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              message: true,
              createdAt: true,
              isAdmin: true,
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);

    return NextResponse.json({
      disputes,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    throw error;
  }
}

export const POST = withApiLogger(createDisputeHandler);
export const GET = withApiLogger(getDisputesHandler);
