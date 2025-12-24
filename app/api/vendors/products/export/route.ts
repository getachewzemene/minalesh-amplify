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

    // Create CSV content with proper escaping
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

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Quote if contains comma, newline, or quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csv = headers.join(',') + '\n';

    products.forEach(product => {
      const row = [
        escapeCSV(product.name),
        escapeCSV(product.brand || ''),
        escapeCSV(product.price),
        escapeCSV(product.salePrice || ''),
        escapeCSV(product.description),
        escapeCSV(product.shortDescription || ''),
        escapeCSV(product.category.name),
        escapeCSV(product.sku || ''),
        escapeCSV(product.stockQuantity),
        escapeCSV(product.lowStockThreshold || 5),
        escapeCSV(product.weight || ''),
        escapeCSV(product.images[0] || ''),
        escapeCSV(product.isDigital),
        escapeCSV(product.isFeatured)
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
