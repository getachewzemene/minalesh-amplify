/**
 * Multi-vendor Commission & Payout System
 * 
 * Handles vendor commission calculation, settlement, and payout scheduling.
 * Generates statements for transparency.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

export const DEFAULT_COMMISSION_RATE = 0.15; // 15%

export interface PayoutCalculation {
  vendorId: string;
  periodStart: Date;
  periodEnd: Date;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  orderCount: number;
}

/**
 * Calculate vendor payout for a given period
 */
export async function calculateVendorPayout(
  vendorId: string,
  periodStart: Date,
  periodEnd: Date,
  commissionRate?: number
): Promise<PayoutCalculation | null> {
  try {
    // Get all completed orders for this vendor in the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        vendorId,
        order: {
          status: {
            in: ['delivered'],
          },
          deliveredAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (orderItems.length === 0) {
      return null;
    }

    // Calculate total sales
    const totalSales = orderItems.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    // Use provided commission rate or default
    const rate = commissionRate ?? DEFAULT_COMMISSION_RATE;
    const commissionAmount = totalSales * rate;
    const payoutAmount = totalSales - commissionAmount;

    // Count unique orders
    const uniqueOrderIds = new Set(orderItems.map((item) => item.order.id));

    return {
      vendorId,
      periodStart,
      periodEnd,
      totalSales,
      commissionRate: rate,
      commissionAmount,
      payoutAmount,
      orderCount: uniqueOrderIds.size,
    };
  } catch (error) {
    console.error('Error calculating vendor payout:', error);
    return null;
  }
}

/**
 * Create vendor payout record
 */
export async function createVendorPayout(
  calculation: PayoutCalculation
): Promise<string | null> {
  try {
    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId: calculation.vendorId,
        periodStart: calculation.periodStart,
        periodEnd: calculation.periodEnd,
        totalSales: new Prisma.Decimal(calculation.totalSales),
        commissionRate: new Prisma.Decimal(calculation.commissionRate),
        commissionAmount: new Prisma.Decimal(calculation.commissionAmount),
        payoutAmount: new Prisma.Decimal(calculation.payoutAmount),
        status: 'pending',
      },
    });

    return payout.id;
  } catch (error) {
    console.error('Error creating vendor payout:', error);
    return null;
  }
}

/**
 * Mark payout as paid
 */
export async function markPayoutAsPaid(payoutId: string): Promise<boolean> {
  try {
    await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    return false;
  }
}

/**
 * Generate vendor statement
 */
export async function generateVendorStatement(
  vendorId: string,
  periodStart: Date,
  periodEnd: Date,
  payoutId?: string
): Promise<string | null> {
  try {
    // Calculate payout if not already done
    let calculation = await calculateVendorPayout(
      vendorId,
      periodStart,
      periodEnd
    );

    if (!calculation) {
      return null;
    }

    // Generate statement number
    const statementNumber = `STMT-${vendorId.slice(0, 8)}-${Date.now()}`;

    const statement = await prisma.vendorStatement.create({
      data: {
        vendorId,
        payoutId: payoutId || null,
        statementNumber,
        periodStart,
        periodEnd,
        totalSales: new Prisma.Decimal(calculation.totalSales),
        commissionAmount: new Prisma.Decimal(calculation.commissionAmount),
        payoutAmount: new Prisma.Decimal(calculation.payoutAmount),
      },
    });

    return statement.id;
  } catch (error) {
    console.error('Error generating vendor statement:', error);
    return null;
  }
}

/**
 * Get vendor statements
 */
export async function getVendorStatements(
  vendorId: string,
  limit: number = 10
) {
  return prisma.vendorStatement.findMany({
    where: { vendorId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      payout: {
        select: {
          status: true,
          paidAt: true,
        },
      },
    },
  });
}

/**
 * Get pending payouts (for admin dashboard)
 */
export async function getPendingPayouts() {
  return prisma.vendorPayout.findMany({
    where: { status: 'pending' },
    include: {
      vendor: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          tinNumber: true,
          tradeLicense: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Schedule monthly payouts for all vendors
 * This should be run as a cron job
 */
export async function scheduleMonthlyPayouts(): Promise<number> {
  try {
    // Get all approved vendors
    const vendors = await prisma.profile.findMany({
      where: {
        isVendor: true,
        vendorStatus: 'approved',
      },
      select: { id: true },
    });

    // Calculate period (previous month)
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    const periodStart = new Date(
      periodEnd.getFullYear(),
      periodEnd.getMonth(),
      1
    ); // First day of previous month

    let createdCount = 0;

    for (const vendor of vendors) {
      // Check if payout already exists for this period
      const existing = await prisma.vendorPayout.findFirst({
        where: {
          vendorId: vendor.id,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
      });

      if (existing) {
        continue; // Skip if already created
      }

      // Calculate and create payout
      const calculation = await calculateVendorPayout(
        vendor.id,
        periodStart,
        periodEnd
      );

      if (calculation && calculation.totalSales > 0) {
        const payoutId = await createVendorPayout(calculation);
        if (payoutId) {
          // Generate statement
          await generateVendorStatement(
            vendor.id,
            periodStart,
            periodEnd,
            payoutId
          );
          createdCount++;
        }
      }
    }

    return createdCount;
  } catch (error) {
    console.error('Error scheduling monthly payouts:', error);
    return 0;
  }
}

/**
 * Get vendor dashboard summary
 */
export async function getVendorPayoutSummary(vendorId: string) {
  try {
    const [totalEarnings, pendingPayouts, paidPayouts, recentStatements] =
      await Promise.all([
        // Total all-time earnings
        prisma.vendorPayout.aggregate({
          where: { vendorId, status: 'paid' },
          _sum: { payoutAmount: true },
        }),
        // Pending payouts
        prisma.vendorPayout.findMany({
          where: { vendorId, status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        // Recent paid payouts
        prisma.vendorPayout.findMany({
          where: { vendorId, status: 'paid' },
          orderBy: { paidAt: 'desc' },
          take: 5,
        }),
        // Recent statements
        getVendorStatements(vendorId, 5),
      ]);

    return {
      totalEarnings: Number(totalEarnings._sum.payoutAmount ?? 0),
      pendingPayouts,
      paidPayouts,
      recentStatements,
    };
  } catch (error) {
    console.error('Error getting vendor payout summary:', error);
    return null;
  }
}

/**
 * Get commission rate for a vendor (can be customized per vendor)
 */
export async function getVendorCommissionRate(
  vendorId: string
): Promise<number> {
  // For now, return default rate
  // In future, this could be stored in a vendor settings table
  return DEFAULT_COMMISSION_RATE;
}
