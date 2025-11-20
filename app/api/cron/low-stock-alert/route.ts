import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

/**
 * GET /api/cron/low-stock-alert
 * 
 * Cron job to check for low stock products and send alerts to admins/vendors
 * 
 * Should be scheduled to run daily via Vercel Cron, GitHub Actions, or external scheduler
 * 
 * Authentication: Requires CRON_SECRET header matching environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.warn('CRON_SECRET environment variable not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (cronSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products with low stock
    const lowStockProducts = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string | null;
        stock_quantity: number;
        low_stock_threshold: number;
        vendor_id: string;
        price: number;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.low_stock_threshold,
        p.vendor_id,
        p.price
      FROM products p
      WHERE p.stock_quantity <= p.low_stock_threshold
        AND p.is_active = true
      ORDER BY p.stock_quantity ASC
    `;

    if (lowStockProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No low stock products found',
        count: 0,
      });
    }

    // Group products by vendor
    const vendorProducts = new Map<string, typeof lowStockProducts>();
    for (const product of lowStockProducts) {
      if (!vendorProducts.has(product.vendor_id)) {
        vendorProducts.set(product.vendor_id, []);
      }
      vendorProducts.get(product.vendor_id)!.push(product);
    }

    // Get vendor information
    const vendorIds = Array.from(vendorProducts.keys());
    const vendors = await prisma.profile.findMany({
      where: { id: { in: vendorIds } },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    let emailsSent = 0;

    // Send email to each vendor
    for (const vendor of vendors) {
      const products = vendorProducts.get(vendor.id) || [];
      const criticalCount = products.filter((p) => p.stock_quantity <= 0).length;
      const lowCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;

      if (products.length === 0) continue;

      try {
        const productsList = products
          .map(
            (p) =>
              `- ${p.name} (SKU: ${p.sku || 'N/A'}): ${p.stock_quantity} units (threshold: ${p.low_stock_threshold})`
          )
          .join('\n');

        const emailTemplate = {
          to: vendor.user.email,
          subject: `Low Stock Alert: ${products.length} Product${products.length > 1 ? 's' : ''} Need Attention`,
          html: `
            <h2>Low Stock Alert</h2>
            <p>Hello ${vendor.displayName || vendor.firstName || 'Vendor'},</p>
            <p>The following products have low stock levels and need your attention:</p>
            <ul>
              <li><strong>Critical (Out of Stock):</strong> ${criticalCount} products</li>
              <li><strong>Low Stock:</strong> ${lowCount} products</li>
            </ul>
            <h3>Products:</h3>
            <pre>${productsList}</pre>
            <p>Please restock these items as soon as possible to avoid lost sales.</p>
            <p>Best regards,<br/>Minalesh Team</p>
          `,
          text: `
Low Stock Alert

Hello ${vendor.displayName || vendor.firstName || 'Vendor'},

The following products have low stock levels and need your attention:

- Critical (Out of Stock): ${criticalCount} products
- Low Stock: ${lowCount} products

Products:
${productsList}

Please restock these items as soon as possible to avoid lost sales.

Best regards,
Minalesh Team
          `,
        };

        await sendEmail(emailTemplate);
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send low stock alert to vendor ${vendor.id}:`, emailError);
      }
    }

    // Send summary to admins
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      
      if (adminEmails.length > 0) {
        const criticalCount = lowStockProducts.filter((p) => p.stock_quantity <= 0).length;
        const lowCount = lowStockProducts.filter(
          (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
        ).length;

        for (const adminEmail of adminEmails) {
          const emailTemplate = {
            to: adminEmail.trim(),
            subject: `Low Stock Summary: ${lowStockProducts.length} Products Need Attention`,
            html: `
              <h2>Low Stock Summary</h2>
              <p>Hello Admin,</p>
              <p>Here's the low stock summary for today:</p>
              <ul>
                <li><strong>Total Low Stock Products:</strong> ${lowStockProducts.length}</li>
                <li><strong>Critical (Out of Stock):</strong> ${criticalCount}</li>
                <li><strong>Low Stock:</strong> ${lowCount}</li>
                <li><strong>Vendors Affected:</strong> ${vendors.length}</li>
                <li><strong>Alerts Sent:</strong> ${emailsSent}</li>
              </ul>
              <p>View the full report in the admin dashboard.</p>
              <p>Best regards,<br/>Minalesh System</p>
            `,
            text: `
Low Stock Summary

Hello Admin,

Here's the low stock summary for today:

- Total Low Stock Products: ${lowStockProducts.length}
- Critical (Out of Stock): ${criticalCount}
- Low Stock: ${lowCount}
- Vendors Affected: ${vendors.length}
- Alerts Sent: ${emailsSent}

View the full report in the admin dashboard.

Best regards,
Minalesh System
            `,
          };

          await sendEmail(emailTemplate);
        }
      }
    } catch (adminEmailError) {
      console.error('Failed to send low stock summary to admins:', adminEmailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Low stock alerts sent',
      productsFound: lowStockProducts.length,
      vendorsNotified: emailsSent,
      criticalCount: lowStockProducts.filter((p) => p.stock_quantity <= 0).length,
    });
  } catch (error) {
    console.error('Error in low stock alert cron:', error);
    return NextResponse.json(
      { error: 'Failed to process low stock alerts' },
      { status: 500 }
    );
  }
}
