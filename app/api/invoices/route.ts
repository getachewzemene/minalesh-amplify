import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import {
  createInvoice,
  getInvoice,
  getInvoiceByOrder,
  generateInvoiceHTML,
  listInvoices,
} from '@/lib/invoice';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const createInvoiceSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().optional(),
});

// POST /api/invoices - Create invoice for an order
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { orderId, notes } = parsed.data;

    // Check if user owns the order or is admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const userIsAdmin = isAdmin(payload.email);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only create invoices for your own orders' },
        { status: 403 }
      );
    }

    const result = await createInvoice({
      orderId,
      notes,
      issueDate: new Date(),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/invoices?invoiceId=xxx or ?orderId=xxx or list all (admin)
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const orderId = searchParams.get('orderId');
    const format = searchParams.get('format'); // 'html' for HTML output

    const userIsAdmin = isAdmin(payload.email);

    // Get specific invoice by ID
    if (invoiceId) {
      const invoice = await getInvoice(invoiceId);

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Check authorization
      if (!userIsAdmin && invoice.order.userId !== payload.userId) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view your own invoices' },
          { status: 403 }
        );
      }

      if (format === 'html') {
        const html = generateInvoiceHTML(invoice);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      return NextResponse.json(invoice);
    }

    // Get invoice by order ID
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (!userIsAdmin && order.userId !== payload.userId) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view your own invoices' },
          { status: 403 }
        );
      }

      const invoice = await getInvoiceByOrder(orderId);

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      if (format === 'html') {
        const html = generateInvoiceHTML(invoice);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      return NextResponse.json(invoice);
    }

    // List all invoices (admin only)
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const invoices = await listInvoices({
      status,
      limit,
      offset,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
