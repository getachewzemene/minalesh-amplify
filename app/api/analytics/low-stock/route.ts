import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, isAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/low-stock
 * 
 * Get products with low stock levels (stock below threshold)
 * Query params:
 * - threshold: number (optional, default: use product's lowStockThreshold)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * 
 * Returns:
 * - products: Array of products with low stock
 * - total: Total count of low stock products
 * - criticalCount: Count of products with 0 or negative stock
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !isAdmin(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const thresholdParam = searchParams.get('threshold');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause for low stock
    // If threshold is provided, use it; otherwise use each product's lowStockThreshold
    const whereClause = thresholdParam
      ? {
          stockQuantity: {
            lte: parseInt(thresholdParam),
          },
          isActive: true,
        }
      : {
          OR: [
            {
              // Stock is at or below the product's threshold
              stockQuantity: {
                lte: prisma.$queryRaw`low_stock_threshold`,
              },
            },
          ],
          isActive: true,
        };

    // For the custom query, we'll use raw SQL
    let products;
    let countResult;

    if (thresholdParam) {
      const threshold = parseInt(thresholdParam);
      products = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          vendor_id: string;
          price: number;
          is_active: boolean;
          created_at: Date;
        }>
      >`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.low_stock_threshold,
          p.vendor_id,
          p.price,
          p.is_active,
          p.created_at
        FROM products p
        WHERE p.stock_quantity <= ${threshold}
          AND p.is_active = true
        ORDER BY p.stock_quantity ASC, p.name ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count
      countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.stock_quantity <= ${threshold}
          AND p.is_active = true
      `;
    } else {
      products = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          vendor_id: string;
          price: number;
          is_active: boolean;
          created_at: Date;
        }>
      >`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.low_stock_threshold,
          p.vendor_id,
          p.price,
          p.is_active,
          p.created_at
        FROM products p
        WHERE p.stock_quantity <= p.low_stock_threshold
          AND p.is_active = true
        ORDER BY p.stock_quantity ASC, p.name ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count
      countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM products p
        WHERE p.stock_quantity <= p.low_stock_threshold
          AND p.is_active = true
      `;
    }

    // Get critical count (0 or negative stock)
    const criticalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM products p
      WHERE p.stock_quantity <= 0
        AND p.is_active = true
    `;

    const total = Number(countResult[0]?.count || 0);
    const criticalCount = Number(criticalResult[0]?.count || 0);

    // Get vendor information for the products
    const vendorIds = products.map((p) => p.vendor_id);
    const vendors = await prisma.profile.findMany({
      where: { id: { in: vendorIds } },
      select: {
        id: true,
        displayName: true,
        firstName: true,
        lastName: true,
      },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    // Format response
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      lowStockThreshold: p.low_stock_threshold,
      price: Number(p.price),
      status:
        p.stock_quantity <= 0
          ? 'out_of_stock'
          : p.stock_quantity <= p.low_stock_threshold
          ? 'low_stock'
          : 'in_stock',
      vendor: vendorMap.get(p.vendor_id) || null,
      createdAt: p.created_at,
    }));

    return NextResponse.json({
      products: formattedProducts,
      total,
      criticalCount,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}
