import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import { withRoleCheck } from '@/lib/middleware';
import { calculateTaxReportSummary, TaxReportPeriod } from '@/lib/ethiopian-tax';

/**
 * @swagger
 * /api/vendors/tax-report:
 *   get:
 *     summary: Get vendor tax report
 *     description: Generate tax compliance report for Ethiopian tax authorities (vendors only)
 *     tags: [Vendors, Tax Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD)
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, annual]
 *           default: monthly
 *         description: Report period type
 *     responses:
 *       200:
 *         description: Tax report generated successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor profile not found
 */

async function getVendorTaxReportHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const periodType = (searchParams.get('periodType') || 'monthly') as 'monthly' | 'quarterly' | 'annual';

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get vendor profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        displayName: true,
        isVendor: true,
        tinNumber: true,
        tradeLicense: true,
      },
    });

    if (!profile || !profile.isVendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // Get all orders for this vendor in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        orderItems: {
          some: {
            vendorId: profile.id,
          },
        },
        status: { in: ['paid', 'confirmed', 'processing', 'fulfilled', 'shipped', 'delivered'] },
      },
      include: {
        orderItems: {
          where: {
            vendorId: profile.id,
          },
          include: {
            product: {
              select: {
                name: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate sales data for tax reporting
    const salesData = orders.flatMap((order) =>
      order.orderItems.map((item) => {
        const categorySlug = item.product.category?.slug || '';
        const isVATExempt = isVATExemptCategory(categorySlug);
        const itemSubtotal = Number(item.price) * item.quantity;
        const itemDiscount = Number(item.discount);
        const itemTotal = itemSubtotal - itemDiscount;

        // Calculate VAT (15% for non-exempt items)
        const vatAmount = isVATExempt ? 0 : itemTotal * 0.15;

        return {
          amount: itemTotal,
          isVATExempt,
          vatAmount,
          withholdingTaxAmount: 0, // Withholding tax is typically handled at payout
        };
      })
    );

    const period: TaxReportPeriod = {
      startDate,
      endDate,
      periodType,
    };

    const summary = calculateTaxReportSummary(salesData, period);

    // Get detailed breakdown by category
    const categoryBreakdown = orders.reduce((acc, order) => {
      order.orderItems.forEach((item) => {
        const categoryName = item.product.category?.slug || 'uncategorized';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            totalSales: 0,
            vatCollected: 0,
            itemCount: 0,
          };
        }

        const itemSubtotal = Number(item.price) * item.quantity;
        const itemDiscount = Number(item.discount);
        const itemTotal = itemSubtotal - itemDiscount;
        const isVATExempt = isVATExemptCategory(categoryName);
        const vatAmount = isVATExempt ? 0 : itemTotal * 0.15;

        acc[categoryName].totalSales += itemTotal;
        acc[categoryName].vatCollected += vatAmount;
        acc[categoryName].itemCount += item.quantity;
      });
      return acc;
    }, {} as Record<string, { category: string; totalSales: number; vatCollected: number; itemCount: number }>);

    return NextResponse.json({
      vendor: {
        id: profile.id,
        displayName: profile.displayName,
        tinNumber: profile.tinNumber,
        tradeLicense: profile.tradeLicense,
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        periodType,
      },
      summary: {
        totalSales: Number(summary.totalSales.toFixed(2)),
        taxableAmount: Number(summary.taxableAmount.toFixed(2)),
        vatCollected: Number(summary.vatCollected.toFixed(2)),
        withholdingTaxDeducted: Number(summary.withholdingTaxDeducted.toFixed(2)),
        netTaxLiability: Number(summary.netTaxLiability.toFixed(2)),
      },
      breakdown: Object.values(categoryBreakdown).map((item) => ({
        ...item,
        totalSales: Number(item.totalSales.toFixed(2)),
        vatCollected: Number(item.vatCollected.toFixed(2)),
      })),
      metadata: {
        totalOrders: orders.length,
        totalItems: orders.reduce(
          (sum, order) => sum + order.orderItems.reduce((s, item) => s + item.quantity, 0),
          0
        ),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating tax report:', error);
    throw error;
  }
}

// Helper function to check if category is VAT exempt
function isVATExemptCategory(categorySlug: string): boolean {
  const exemptCategories = [
    'basic-food',
    'agriculture',
    'agricultural-inputs',
    'medicine',
    'medical-supplies',
    'medical-equipment',
    'books',
    'educational-materials',
    'school-supplies',
    'financial-services',
    'insurance',
    'fertilizer',
    'seeds',
    'livestock',
    'veterinary-services',
  ];

  return exemptCategories.includes(categorySlug.toLowerCase());
}

export const GET = withApiLogger(
  withRoleCheck(getVendorTaxReportHandler, ['vendor', 'admin'])
);
