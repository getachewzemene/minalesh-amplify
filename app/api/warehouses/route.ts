/**
 * Warehouse API endpoints
 * GET /api/warehouses - List all warehouses
 * POST /api/warehouses - Create a new warehouse (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/warehouses
 * List all active warehouses with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const isActive = searchParams.get('isActive');
    const isPrimary = searchParams.get('isPrimary');

    const where: any = {};
    
    if (city) {
      where.city = city;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (isPrimary !== null && isPrimary !== undefined) {
      where.isPrimary = isPrimary === 'true';
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      warehouses,
      count: warehouses.length,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/warehouses
 * Create a new warehouse (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const auth = await requireAuth(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      address,
      city,
      region,
      country = 'Ethiopia',
      postalCode,
      latitude,
      longitude,
      phone,
      email,
      managerName,
      capacity,
      operatingHours,
      isActive = true,
      isPrimary = false,
    } = body;

    // Validate required fields
    if (!name || !code || !address || !city || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.warehouse.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Warehouse code already exists' },
        { status: 409 }
      );
    }

    // If this is set as primary, unset other primary warehouses
    if (isPrimary) {
      await prisma.warehouse.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        city,
        region,
        country,
        postalCode,
        latitude,
        longitude,
        phone,
        email,
        managerName,
        capacity,
        operatingHours: operatingHours || {},
        isActive,
        isPrimary,
      },
    });

    return NextResponse.json({
      success: true,
      warehouse,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
