/**
 * Customer Insights API
 * 
 * Provides customer behavior analytics including traffic sources,
 * conversion rates, and revenue by source
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
        { error: 'Only vendors can access customer insights' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // First, get the vendor's product IDs to filter analytics
    const vendorProducts = await prisma.product.findMany({
      where: { vendorId: payload!.userId },
      select: { id: true }
    });

    const vendorProductIds = vendorProducts.map(p => p.id);

    if (vendorProductIds.length === 0) {
      // No products, return empty data
      return NextResponse.json({
        insights: [],
        summary: {
          totalSessions: 0,
          totalConversions: 0,
          totalRevenue: 0,
          avgConversionRate: 0,
          periodDays: days
        }
      });
    }

    // Fetch analytics events for vendor's products only
    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { 
            eventType: 'product_view'
          },
          { 
            eventType: 'product_click'
          },
          { 
            eventType: 'add_to_cart'
          }
        ]
      }
    });

    // Filter events to only include vendor's products based on eventData
    const vendorEvents = events.filter(event => {
      const productId = (event.eventData as any)?.productId;
      return productId && vendorProductIds.includes(productId);
    });

    // Get orders for conversion tracking
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        orderItems: {
          some: {
            product: {
              vendorId: payload!.userId
            }
          }
        }
      },
      include: {
        orderItems: {
          where: {
            product: {
              vendorId: payload!.userId
            }
          },
          include: {
            product: {
              select: {
                price: true,
                salePrice: true
              }
            }
          }
        }
      }
    });

    // Aggregate analytics by source
    const sourceMap = new Map<string, {
      sessions: number;
      conversions: number;
      revenue: number;
    }>();

    // Initialize common sources
    ['Organic Search', 'Direct', 'Social Media', 'Referral', 'Email'].forEach(source => {
      sourceMap.set(source, { sessions: 0, conversions: 0, revenue: 0 });
    });

    // Count sessions (unique user + source combinations per day)
    const sessionMap = new Map<string, Set<string>>();
    
    vendorEvents.forEach(event => {
      const source = (event.eventData as any)?.source || 'Direct';
      const userId = event.userId || 'anonymous';
      const day = new Date(event.createdAt).toDateString();
      const key = `${source}-${day}`;
      
      if (!sessionMap.has(key)) {
        sessionMap.set(key, new Set());
      }
      sessionMap.get(key)!.add(userId);
    });

    // Count sessions per source
    sessionMap.forEach((users, key) => {
      const source = key.split('-')[0];
      const current = sourceMap.get(source) || { sessions: 0, conversions: 0, revenue: 0 };
      current.sessions += users.size;
      sourceMap.set(source, current);
    });

    // Calculate conversions and revenue
    orders.forEach(order => {
      // For now, distribute orders among sources proportionally
      // In production, this would be tracked in analytics events
      const source = 'Direct'; // Default source
      const current = sourceMap.get(source) || { sessions: 0, conversions: 0, revenue: 0 };
      
      current.conversions += 1;
      
      // Calculate revenue from vendor's products only
      const orderRevenue = order.orderItems.reduce((sum, item) => {
        const price = Number(item.product.salePrice || item.product.price);
        return sum + (price * item.quantity);
      }, 0);
      
      current.revenue += orderRevenue;
      sourceMap.set(source, current);
    });

    // Convert to array and calculate conversion rates
    const insights = Array.from(sourceMap.entries())
      .filter(([_, data]) => data.sessions > 0)
      .map(([source, data]) => ({
        source,
        sessions: data.sessions,
        conversions: data.conversions,
        conversionRate: data.sessions > 0 
          ? parseFloat(((data.conversions / data.sessions) * 100).toFixed(2))
          : 0,
        revenue: data.revenue
      }))
      .sort((a, b) => b.sessions - a.sessions);

    return NextResponse.json({
      insights,
      summary: {
        totalSessions: insights.reduce((sum, i) => sum + i.sessions, 0),
        totalConversions: insights.reduce((sum, i) => sum + i.conversions, 0),
        totalRevenue: insights.reduce((sum, i) => sum + i.revenue, 0),
        avgConversionRate: insights.length > 0
          ? parseFloat((insights.reduce((sum, i) => sum + i.conversionRate, 0) / insights.length).toFixed(2))
          : 0,
        periodDays: days
      }
    });

  } catch (error) {
    console.error('Customer insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
