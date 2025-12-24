/**
 * Product Export API
 * 
 * Exports vendor's products to CSV format for bulk editing
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    // Check if user is a vendor
    const profile = await prisma.profile.findUnique({
      where: { userId: payload!.userId },
      select: { isVendor: true }
    });

    if (!profile?.isVendor) {
      return NextResponse.json(
        { error: 'Only vendors can export products' },
        { status: 403 }
      );
    }

    // Fetch all vendor's products
    const products = await prisma.product.findMany({
      where: { vendorId: payload!.userId },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Create CSV content
    const headers = [
      'name',
      'brand',
      'price',
      'salePrice',
      'description',
      'shortDescription',
      'category',
      'sku',
      'stockQuantity',
      'lowStockThreshold',
      'weight',
      'imageUrl',
      'isDigital',
      'isFeatured'
    ];

    let csv = headers.join(',') + '\n';

    products.forEach(product => {
      const row = [
        `"${product.name.replace(/"/g, '""')}"`,
        product.brand ? `"${product.brand.replace(/"/g, '""')}"` : '',
        product.price.toString(),
        product.salePrice?.toString() || '',
        `"${product.description.replace(/"/g, '""')}"`,
        product.shortDescription ? `"${product.shortDescription.replace(/"/g, '""')}"` : '',
        `"${product.category.name}"`,
        product.sku || '',
        product.stockQuantity.toString(),
        product.lowStockThreshold?.toString() || '5',
        product.weight?.toString() || '',
        product.images[0] || '',
        product.isDigital.toString(),
        product.isFeatured.toString()
      ];

      csv += row.join(',') + '\n';
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
