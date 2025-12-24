/**
 * Bulk Product Upload API
 * 
 * Handles CSV/Excel file uploads for bulk product creation
 * Validates file format and data, then creates products in batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProductRow {
  name: string;
  brand?: string;
  price: number;
  salePrice?: number;
  description: string;
  shortDescription?: string;
  category: string;
  sku?: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  weight?: number;
  imageUrl?: string;
  isDigital?: boolean;
  isFeatured?: boolean;
}

export async function POST(request: NextRequest) {
  const { error, payload } = withAuth(request);
  if (error) return error;

  try {
    // Check if user is a vendor
    const profile = await prisma.profile.findUnique({
      where: { userId: payload!.userId },
      select: { isVendor: true, vendorStatus: true }
    });

    if (!profile?.isVendor || profile.vendorStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved vendors can upload products' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Parse CSV/Excel file
    const text = await file.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'price', 'description', 'category', 'stockquantity'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse rows
    const products: ProductRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      try {
        const product: any = {};
        headers.forEach((header, index) => {
          product[header] = values[index];
        });

        // Validate and convert types
        const productRow: ProductRow = {
          name: product.name || '',
          brand: product.brand || undefined,
          price: parseFloat(product.price || '0'),
          salePrice: product.saleprice ? parseFloat(product.saleprice) : undefined,
          description: product.description || '',
          shortDescription: product.shortdescription || undefined,
          category: product.category || '',
          sku: product.sku || undefined,
          stockQuantity: parseInt(product.stockquantity || '0'),
          lowStockThreshold: product.lowstockthreshold ? parseInt(product.lowstockthreshold) : 5,
          weight: product.weight ? parseFloat(product.weight) : undefined,
          imageUrl: product.imageurl || undefined,
          isDigital: product.isdigital?.toLowerCase() === 'true' || false,
          isFeatured: product.isfeatured?.toLowerCase() === 'true' || false,
        };

        // Validate required fields
        if (!productRow.name || !productRow.description || !productRow.category) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        if (productRow.price <= 0 || productRow.stockQuantity < 0) {
          errors.push(`Row ${i + 1}: Invalid price or stock quantity`);
          continue;
        }

        products.push(productRow);
      } catch (error) {
        errors.push(`Row ${i + 1}: Invalid data format`);
      }
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found in file', errors },
        { status: 400 }
      );
    }

    // Create products in database
    const created: any[] = [];
    const failed: string[] = [];

    for (const productData of products) {
      try {
        // Find or create category
        let category = await prisma.category.findFirst({
          where: { name: productData.category }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: productData.category,
              slug: productData.category.toLowerCase().replace(/\s+/g, '-')
            }
          });
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            slug: `${productData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            brand: productData.brand,
            price: productData.price,
            salePrice: productData.salePrice,
            description: productData.description,
            shortDescription: productData.shortDescription,
            categoryId: category.id,
            sku: productData.sku,
            stockQuantity: productData.stockQuantity,
            lowStockThreshold: productData.lowStockThreshold,
            weight: productData.weight,
            images: productData.imageUrl ? [productData.imageUrl] : [],
            isDigital: productData.isDigital,
            isFeatured: productData.isFeatured,
            vendorId: payload!.userId
          }
        });

        created.push(product);
      } catch (error) {
        console.error('Error creating product:', error);
        failed.push(productData.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${created.length} products successfully`,
      created: created.length,
      failed: failed.length,
      errors: failed.length > 0 ? failed : undefined,
      parseErrors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
