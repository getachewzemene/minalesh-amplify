import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

// Check if user is admin
function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * POST /api/admin/bulk-operations
 * Perform bulk operations on orders, products, or users
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
    const { operation, entityType, entityIds, data } = body;

    if (!operation || !entityType || !entityIds || !Array.isArray(entityIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: operation, entityType, entityIds' },
        { status: 400 }
      );
    }

    let result;

    switch (entityType) {
      case 'orders':
        result = await handleOrdersBulkOperation(operation, entityIds, data);
        break;
      case 'products':
        result = await handleProductsBulkOperation(operation, entityIds, data);
        break;
      case 'users':
        result = await handleUsersBulkOperation(operation, entityIds, data);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

async function handleOrdersBulkOperation(operation: string, orderIds: string[], data?: any) {
  switch (operation) {
    case 'update_status': {
      if (!data?.status) {
        throw new Error('Status is required for update_status operation');
      }
      
      const updated = await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { 
          status: data.status,
          updatedAt: new Date(),
        },
      });
      
      return {
        operation: 'update_status',
        updated: updated.count,
        status: data.status,
      };
    }

    case 'export': {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });
      
      return {
        operation: 'export',
        orders: orders.map((order) => ({
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          customer: order.user.email,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        })),
      };
    }

    case 'cancel': {
      const updated = await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { 
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });
      
      return {
        operation: 'cancel',
        cancelled: updated.count,
      };
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function handleProductsBulkOperation(operation: string, productIds: string[], data?: any) {
  switch (operation) {
    case 'activate': {
      const updated = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: true },
      });
      
      return {
        operation: 'activate',
        updated: updated.count,
      };
    }

    case 'deactivate': {
      const updated = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { isActive: false },
      });
      
      return {
        operation: 'deactivate',
        updated: updated.count,
      };
    }

    case 'update_price': {
      if (!data?.priceAdjustment || !data?.adjustmentType) {
        throw new Error('Price adjustment data is required');
      }

      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      const updates = products.map((product) => {
        let newPrice = product.price;
        
        if (data.adjustmentType === 'percentage') {
          const adjustment = product.price.mul(data.priceAdjustment).div(100);
          newPrice = product.price.add(adjustment);
        } else if (data.adjustmentType === 'fixed') {
          newPrice = product.price.add(data.priceAdjustment);
        }

        return prisma.product.update({
          where: { id: product.id },
          data: { price: newPrice },
        });
      });

      await Promise.all(updates);
      
      return {
        operation: 'update_price',
        updated: updates.length,
        adjustmentType: data.adjustmentType,
        adjustment: data.priceAdjustment,
      };
    }

    case 'delete': {
      const deleted = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
      
      return {
        operation: 'delete',
        deleted: deleted.count,
      };
    }

    case 'export': {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      });
      
      return {
        operation: 'export',
        products: products.map((product) => ({
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          category: product.category?.name,
          vendor: product.vendor?.businessName,
          isActive: product.isActive,
        })),
      };
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function handleUsersBulkOperation(operation: string, userIds: string[], data?: any) {
  switch (operation) {
    case 'suspend': {
      const updated = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { 
          isActive: false,
          updatedAt: new Date(),
        },
      });
      
      return {
        operation: 'suspend',
        suspended: updated.count,
      };
    }

    case 'activate': {
      const updated = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { 
          isActive: true,
          updatedAt: new Date(),
        },
      });
      
      return {
        operation: 'activate',
        activated: updated.count,
      };
    }

    case 'export': {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });
      
      return {
        operation: 'export',
        users: users.map((user) => ({
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          phone: user.profile?.phone,
          joinedAt: user.createdAt,
        })),
      };
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
