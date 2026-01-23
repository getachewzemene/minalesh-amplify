/**
 * Individual Warehouse API endpoints
 * GET /api/warehouses/[id] - Get warehouse by ID
 * PATCH /api/warehouses/[id] - Update warehouse (admin only)
 * DELETE /api/warehouses/[id] - Delete warehouse (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/warehouses/[id]
 * Get a specific warehouse by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/warehouses/[id]
 * Update a warehouse (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      address,
      city,
      region,
      postalCode,
      latitude,
      longitude,
      phone,
      email,
      managerName,
      capacity,
      operatingHours,
      isActive,
      isPrimary,
    } = body;

    // If setting as primary, unset other primary warehouses
    if (isPrimary) {
      await prisma.warehouse.updateMany({
        where: { 
          isPrimary: true,
          NOT: { id: params.id },
        },
        data: { isPrimary: false },
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(region !== undefined && { region }),
        ...(postalCode !== undefined && { postalCode }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(managerName !== undefined && { managerName }),
        ...(capacity !== undefined && { capacity }),
        ...(operatingHours !== undefined && { operatingHours }),
        ...(isActive !== undefined && { isActive }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    return NextResponse.json({
      success: true,
      warehouse,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/warehouses/[id]
 * Delete a warehouse (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Check if warehouse has any orders
    const orderCount = await prisma.order.count({
      where: { warehouseId: params.id },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete warehouse with ${orderCount} associated orders. Consider deactivating instead.`,
        },
        { status: 409 }
      );
    }

    await prisma.warehouse.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
