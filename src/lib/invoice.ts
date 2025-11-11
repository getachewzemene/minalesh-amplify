/**
 * Invoice & Receipt Generation System
 * 
 * Generates invoices with sequential numbering, compliance data,
 * and support for PDF generation and email delivery.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

export interface InvoiceData {
  orderId: string;
  issueDate?: Date;
  dueDate?: Date;
  notes?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  error?: string;
}

/**
 * Generate unique invoice number with sequential numbering
 */
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Get count of invoices this month for sequential number
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.invoice.count({
    where: {
      issueDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequenceNumber = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequenceNumber}`;
}

/**
 * Create invoice for an order
 */
export async function createInvoice(
  data: InvoiceData
): Promise<InvoiceResult> {
  const { orderId, issueDate, dueDate, notes } = data;

  try {
    // Check if invoice already exists
    const existing = await prisma.invoice.findUnique({
      where: { orderId },
    });

    if (existing) {
      return {
        success: false,
        error: 'Invoice already exists for this order',
      };
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        orderItems: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Get vendor compliance data (TIN, Trade License)
    // For multi-vendor, we'll use the primary vendor (first order item)
    const primaryVendor = order.orderItems[0]?.vendor;
    const tinNumber = primaryVendor?.tinNumber || null;
    const tradeLicense = primaryVendor?.tradeLicense || null;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        issueDate: issueDate || new Date(),
        dueDate: dueDate || null,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.paymentStatus === 'completed' ? 'paid' : 'draft',
        paidAt: order.paidAt,
        notes: notes || null,
        tinNumber,
        tradeLicense,
      },
    });

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: 'Failed to create invoice' };
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          orderItems: {
            include: {
              product: true,
              vendor: true,
            },
          },
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get invoice by order ID
 */
export async function getInvoiceByOrder(orderId: string) {
  return prisma.invoice.findUnique({
    where: { orderId },
    include: {
      order: {
        include: {
          orderItems: {
            include: {
              product: true,
              vendor: true,
            },
          },
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Generate invoice HTML (for PDF generation or email)
 */
export function generateInvoiceHTML(invoice: any): string {
  const order = invoice.order;
  const customer = order.user?.profile;
  const shippingAddr = order.shippingAddress as any;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; }
    .invoice-details { text-align: right; }
    .section { margin: 30px 0; }
    .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; }
    .totals { margin-top: 30px; }
    .totals table { width: 400px; margin-left: auto; }
    .totals td { padding: 8px; }
    .totals .total-row { font-weight: bold; font-size: 16px; background: #f5f5f5; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .compliance { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">Minalesh Marketplace</div>
      <div>Ethiopian E-commerce Platform</div>
    </div>
    <div class="invoice-details">
      <div><strong>INVOICE</strong></div>
      <div>Invoice #: ${invoice.invoiceNumber}</div>
      <div>Date: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
      ${invoice.dueDate ? `<div>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ''}
      <div>Order #: ${order.orderNumber}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">BILL TO</div>
    <div>${customer?.displayName || customer?.firstName + ' ' + customer?.lastName || 'Customer'}</div>
    ${shippingAddr?.line1 ? `<div>${shippingAddr.line1}</div>` : ''}
    ${shippingAddr?.city ? `<div>${shippingAddr.city}, ${shippingAddr.country || 'Ethiopia'}</div>` : ''}
    ${customer?.phone ? `<div>Phone: ${customer.phone}</div>` : ''}
    ${order.user?.email ? `<div>Email: ${order.user.email}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>SKU</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.orderItems
        .map(
          (item: any) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.productSku || '-'}</td>
          <td>${item.quantity}</td>
          <td>${invoice.currency} ${Number(item.price).toFixed(2)}</td>
          <td>${invoice.currency} ${Number(item.total).toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td style="text-align: right">${invoice.currency} ${Number(invoice.subtotal).toFixed(2)}</td>
      </tr>
      ${
        Number(invoice.discountAmount) > 0
          ? `
      <tr>
        <td>Discount:</td>
        <td style="text-align: right">-${invoice.currency} ${Number(invoice.discountAmount).toFixed(2)}</td>
      </tr>
      `
          : ''
      }
      <tr>
        <td>Shipping:</td>
        <td style="text-align: right">${invoice.currency} ${Number(invoice.shippingAmount).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Tax (15% VAT):</td>
        <td style="text-align: right">${invoice.currency} ${Number(invoice.taxAmount).toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL:</td>
        <td style="text-align: right">${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}</td>
      </tr>
      ${
        invoice.paidAt
          ? `
      <tr>
        <td colspan="2" style="text-align: right; color: green;">
          <strong>PAID</strong> on ${new Date(invoice.paidAt).toLocaleDateString()}
        </td>
      </tr>
      `
          : ''
      }
    </table>
  </div>

  ${
    invoice.notes
      ? `
  <div class="section">
    <div class="section-title">NOTES</div>
    <div>${invoice.notes}</div>
  </div>
  `
      : ''
  }

  <div class="compliance">
    ${invoice.tinNumber ? `<div><strong>TIN:</strong> ${invoice.tinNumber}</div>` : ''}
    ${invoice.tradeLicense ? `<div><strong>Trade License:</strong> ${invoice.tradeLicense}</div>` : ''}
    <div style="margin-top: 10px;">
      This invoice is issued in accordance with Ethiopian commercial regulations.
      All amounts are in Ethiopian Birr (ETB). VAT is calculated at 15% as per Ethiopian tax law.
    </div>
  </div>

  <div class="footer">
    <div>Thank you for your business!</div>
    <div>For questions about this invoice, please contact support@minalesh.et</div>
  </div>
</body>
</html>
  `;
}

/**
 * Mark invoice as sent via email
 */
export async function markInvoiceAsSent(invoiceId: string): Promise<boolean> {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { emailSentAt: new Date() },
    });
    return true;
  } catch (error) {
    console.error('Error marking invoice as sent:', error);
    return false;
  }
}

/**
 * Update invoice PDF URL (after generation)
 */
export async function updateInvoicePdfUrl(
  invoiceId: string,
  pdfUrl: string
): Promise<boolean> {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl },
    });
    return true;
  } catch (error) {
    console.error('Error updating invoice PDF URL:', error);
    return false;
  }
}

/**
 * List invoices with filtering
 */
export async function listInvoices(params: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const { status, startDate, endDate, limit = 50, offset = 0 } = params;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.issueDate = {};
    if (startDate) where.issueDate.gte = startDate;
    if (endDate) where.issueDate.lte = endDate;
  }

  return prisma.invoice.findMany({
    where,
    include: {
      order: {
        select: {
          orderNumber: true,
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
        },
      },
    },
    orderBy: { issueDate: 'desc' },
    take: limit,
    skip: offset,
  });
}
