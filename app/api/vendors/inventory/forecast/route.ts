/**
 * Inventory Forecast API
 * 
 * Provides inventory forecasting based on sales trends
 * Calculates days until stockout and recommended reorder quantities
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
        { error: 'Only vendors can access inventory forecast' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch vendor's products with recent orders
    const products = await prisma.product.findMany({
      where: { 
        vendorId: payload!.userId,
        stockQuantity: { gt: 0 }
      },
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: { gte: startDate },
              status: { in: ['pending', 'confirmed', 'shipped', 'delivered'] }
            }
          },
          select: {
            quantity: true,
            createdAt: true
          }
        }
      }
    });

    // Calculate forecasts
    const forecasts = products.map(product => {
      // Calculate total sales in the period
      const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Calculate daily average
      const dailyAverage = totalSold / days;
      
      // Calculate days until stockout
      const daysUntilStockout = dailyAverage > 0 
        ? Math.floor(product.stockQuantity / dailyAverage)
        : 999;
      
      // Determine trend based on recent vs older sales
      const midPoint = new Date(startDate.getTime() + (Date.now() - startDate.getTime()) / 2);
      const recentSales = product.orderItems.filter(item => 
        new Date(item.createdAt) >= midPoint
      ).reduce((sum, item) => sum + item.quantity, 0);
      const olderSales = product.orderItems.filter(item => 
        new Date(item.createdAt) < midPoint
      ).reduce((sum, item) => sum + item.quantity, 0);
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentSales > olderSales * 1.2) {
        trend = 'increasing';
      } else if (recentSales < olderSales * 0.8) {
        trend = 'decreasing';
      }
      
      // Calculate recommended reorder quantity
      // Base it on 30 days of supply with 20% buffer
      const recommendedReorder = Math.ceil(dailyAverage * 30 * 1.2);

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stockQuantity,
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        daysUntilStockout,
        recommendedReorder: Math.max(recommendedReorder, 10), // Minimum 10 units
        trend,
        totalSold,
        lowStockAlert: daysUntilStockout < 7
      };
    });

    // Sort by urgency (lowest days until stockout first)
    forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return NextResponse.json({
      forecasts,
      summary: {
        totalProducts: forecasts.length,
        lowStockAlerts: forecasts.filter(f => f.lowStockAlert).length,
        avgDaysUntilStockout: forecasts.reduce((sum, f) => sum + f.daysUntilStockout, 0) / forecasts.length,
        periodDays: days
      }
    });

  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
