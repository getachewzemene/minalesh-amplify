import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/cohort-retention
 * 
 * Get cohort retention analysis
 * Query params:
 * - cohortType: 'week' | 'month' (default: 'week')
 * - cohortCount: number of cohorts to analyze (default: 8)
 * 
 * Returns:
 * - cohorts: Array of cohort data with retention rates over time periods
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || !isAdmin(decoded)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cohortType = searchParams.get('cohortType') || 'week';
    const cohortCount = parseInt(searchParams.get('cohortCount') || '8');

    // Get all users with their first order date
    const users = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        orders: {
          select: {
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      where: {
        orders: {
          some: {},
        },
      },
    });

    // Group users by cohort
    const cohortMap = new Map<string, Set<string>>();
    const userFirstOrderMap = new Map<string, Date>();

    users.forEach((user) => {
      const firstOrder = user.orders[0];
      if (firstOrder) {
        const cohortKey = getCohortKey(firstOrder.createdAt, cohortType);
        userFirstOrderMap.set(user.id, firstOrder.createdAt);
        
        if (!cohortMap.has(cohortKey)) {
          cohortMap.set(cohortKey, new Set());
        }
        cohortMap.get(cohortKey)!.add(user.id);
      }
    });

    // Sort cohorts by date (most recent first)
    const sortedCohorts = Array.from(cohortMap.keys())
      .sort((a, b) => b.localeCompare(a))
      .slice(0, cohortCount);

    // Calculate retention for each cohort
    const cohortData = await Promise.all(
      sortedCohorts.map(async (cohortKey) => {
        const cohortUsers = cohortMap.get(cohortKey)!;
        const cohortSize = cohortUsers.size;
        
        // Calculate retention for each period
        const retentionPeriods: { [key: string]: number } = {};
        const maxPeriods = cohortType === 'week' ? 12 : 6; // 12 weeks or 6 months
        
        for (let period = 0; period <= maxPeriods; period++) {
          const periodKey = `${cohortType}${period}`;
          let activeUsersInPeriod = 0;
          
          for (const userId of cohortUsers) {
            const firstOrderDate = userFirstOrderMap.get(userId)!;
            const periodStart = addPeriods(firstOrderDate, period, cohortType);
            const periodEnd = addPeriods(firstOrderDate, period + 1, cohortType);
            
            // Check if user had any orders in this period
            const hasOrderInPeriod = await prisma.order.count({
              where: {
                userId,
                createdAt: {
                  gte: periodStart,
                  lt: periodEnd,
                },
                status: {
                  notIn: ['cancelled', 'refunded'],
                },
              },
            });
            
            if (hasOrderInPeriod > 0) {
              activeUsersInPeriod++;
            }
          }
          
          retentionPeriods[periodKey] = cohortSize > 0 
            ? Math.round((activeUsersInPeriod / cohortSize) * 100)
            : 0;
        }
        
        return {
          cohort: formatCohortLabel(cohortKey, cohortType),
          cohortDate: cohortKey,
          size: cohortSize,
          ...retentionPeriods,
        };
      })
    );

    return NextResponse.json({
      cohorts: cohortData,
      cohortType,
      periodLabels: Array.from({ length: 13 }, (_, i) => `${cohortType}${i}`),
    });
  } catch (error) {
    console.error('Error fetching cohort retention analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort retention analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get cohort key for a date
 */
function getCohortKey(date: Date, cohortType: string): string {
  const d = new Date(date);
  
  if (cohortType === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } else {
    // week
    const weekNumber = getWeekNumber(d);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }
}

/**
 * Format cohort label for display
 */
function formatCohortLabel(cohortKey: string, cohortType: string): string {
  if (cohortType === 'month') {
    const [year, month] = cohortKey.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  } else {
    return cohortKey.replace('-W', ' Week ');
  }
}

/**
 * Add periods to a date
 */
function addPeriods(date: Date, periods: number, cohortType: string): Date {
  const d = new Date(date);
  
  if (cohortType === 'month') {
    d.setMonth(d.getMonth() + periods);
  } else {
    // week
    d.setDate(d.getDate() + (periods * 7));
  }
  
  return d;
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
