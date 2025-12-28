import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * GET /api/admin/crm
 * Get customer relationship management data including segmentation and lifetime value
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment');

    // Customer Lifetime Value (CLV) calculation
    const customersWithCLV = await prisma.user.findMany({
      where: {
        role: 'customer',
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        orders: {
          where: {
            status: {
              in: ['delivered'] as const,
            },
          },
          select: {
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate CLV and segment customers
    const customerSegments = {
      vip: [] as any[],
      frequent: [] as any[],
      occasional: [] as any[],
      atRisk: [] as any[],
      new: [] as any[],
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    customersWithCLV.forEach((customer) => {
      const totalSpent = customer.orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );
      const orderCount = customer.orders.length;
      const lastOrderDate = customer.orders.length > 0
        ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
        : null;
      const daysSinceLastOrder = lastOrderDate
        ? (now.getTime() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
        : null;
      const daysSinceJoined = (now.getTime() - customer.createdAt.getTime()) / (24 * 60 * 60 * 1000);

      const customerData = {
        id: customer.id,
        email: customer.email,
        name: customer.profile
          ? `${customer.profile.firstName || ''} ${customer.profile.lastName || ''}`
          : customer.email,
        totalSpent,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        lastOrderDate,
        daysSinceLastOrder,
        joinedAt: customer.createdAt,
        daysSinceJoined,
      };

      // Segment logic
      if (totalSpent > 100000 && orderCount >= 10) {
        customerSegments.vip.push({ ...customerData, segment: 'VIP' });
      } else if (orderCount >= 5 && daysSinceLastOrder && daysSinceLastOrder < 30) {
        customerSegments.frequent.push({ ...customerData, segment: 'Frequent' });
      } else if (orderCount >= 2 && orderCount < 5) {
        customerSegments.occasional.push({ ...customerData, segment: 'Occasional' });
      } else if (orderCount > 0 && daysSinceLastOrder && daysSinceLastOrder > 90) {
        customerSegments.atRisk.push({ ...customerData, segment: 'At Risk' });
      } else if (daysSinceJoined < 30) {
        customerSegments.new.push({ ...customerData, segment: 'New' });
      }
    });

    // If specific segment requested, return only that segment
    if (segment && segment in customerSegments) {
      return NextResponse.json({
        success: true,
        segment,
        customers: customerSegments[segment as keyof typeof customerSegments],
        total: customerSegments[segment as keyof typeof customerSegments].length,
      });
    }

    // Return all segments with summary
    return NextResponse.json({
      success: true,
      summary: {
        totalCustomers: customersWithCLV.length,
        vip: customerSegments.vip.length,
        frequent: customerSegments.frequent.length,
        occasional: customerSegments.occasional.length,
        atRisk: customerSegments.atRisk.length,
        new: customerSegments.new.length,
      },
      segments: {
        vip: customerSegments.vip.slice(0, 10), // Top 10 VIP customers
        frequent: customerSegments.frequent.slice(0, 10),
        occasional: customerSegments.occasional.slice(0, 10),
        atRisk: customerSegments.atRisk.slice(0, 10),
        new: customerSegments.new.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching CRM data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CRM data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/crm
 * Send targeted communication to customer segments
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const body = await req.json();
    const { segment, subject, message, customerIds } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    let targetCustomers: any[] = [];

    if (customerIds && Array.isArray(customerIds)) {
      // Send to specific customers
      targetCustomers = await prisma.user.findMany({
        where: {
          id: { in: customerIds },
          role: 'customer',
        },
        select: {
          id: true,
          email: true,
        },
      });
    } else if (segment) {
      // Send to entire segment - would need segment calculation logic here
      // For now, return error
      return NextResponse.json(
        { success: false, error: 'Segment-based messaging not yet implemented' },
        { status: 400 }
      );
    }

    // Basic HTML validation and sanitization
    // Note: In production, use a proper HTML sanitizer like DOMPurify or sanitize-html
    const sanitizedMessage = message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: protocol

    if (sanitizedMessage !== message) {
      return NextResponse.json(
        { success: false, error: 'Message contains potentially unsafe content' },
        { status: 400 }
      );
    }

    // Queue emails for sending
    const emailPromises = targetCustomers.map((customer) => 
      prisma.emailQueue.create({
        data: {
          to: customer.email,
          subject,
          html: sanitizedMessage,
          text: sanitizedMessage.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          template: 'marketing',
          metadata: {
            customerId: customer.id,
            segment,
          },
        },
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      emailsQueued: targetCustomers.length,
      customers: targetCustomers.map(c => c.email),
    });
  } catch (error) {
    console.error('Error sending customer communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send communication' },
      { status: 500 }
    );
  }
}
