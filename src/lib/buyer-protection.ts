/**
 * Buyer Protection Service
 *
 * Provides buyer protection features including:
 * - Money-back guarantee for eligible items
 * - Protection period: 30 days from delivery
 * - Coverage: not received, significantly not as described
 * - Automatic refund if vendor doesn't ship within SLA
 * - Insurance option for high-value items
 */

import prisma from './prisma';
import { initiateRefund, processRefund } from './refund';
import { Prisma } from '@prisma/client';

// Default settings if not configured in database
const DEFAULT_PROTECTION_FEE_PERCENT = 2.5; // 2.5%
const DEFAULT_PROTECTION_PERIOD_DAYS = 30;
const DEFAULT_VENDOR_SHIPPING_SLA_HOURS = 72; // 3 days
const DEFAULT_INSURANCE_THRESHOLD = 5000; // ETB
const DEFAULT_INSURANCE_FEE_PERCENT = 1.5;

export interface BuyerProtectionSettings {
  protectionFeePercent: number;
  protectionPeriodDays: number;
  vendorShippingSLAHours: number;
  insuranceThresholdAmount: number;
  insuranceFeePercent: number;
  isEnabled: boolean;
}

export interface CalculateProtectionFeeResult {
  protectionFee: number;
  insuranceFee: number;
  totalFee: number;
  isHighValue: boolean;
  protectionExpiresAt: Date | null;
  shippingDeadline: Date;
}

export interface FileClaimRequest {
  orderId: string;
  userId: string;
  claimType: 'not_received' | 'not_as_described';
  description?: string;
  evidenceUrls?: string[];
}

export interface FileClaimResult {
  success: boolean;
  claimId?: string;
  error?: string;
}

export interface ProcessClaimResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Get buyer protection settings from database or defaults
 */
export async function getProtectionSettings(): Promise<BuyerProtectionSettings> {
  try {
    const settings = await prisma.buyerProtectionSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (settings) {
      return {
        protectionFeePercent: Number(settings.protectionFeePercent),
        protectionPeriodDays: settings.protectionPeriodDays,
        vendorShippingSLAHours: settings.vendorShippingSLAHours,
        insuranceThresholdAmount: Number(settings.insuranceThresholdAmount),
        insuranceFeePercent: Number(settings.insuranceFeePercent),
        isEnabled: settings.isEnabled,
      };
    }
  } catch {
    // If table doesn't exist yet, return defaults
  }

  return {
    protectionFeePercent: DEFAULT_PROTECTION_FEE_PERCENT,
    protectionPeriodDays: DEFAULT_PROTECTION_PERIOD_DAYS,
    vendorShippingSLAHours: DEFAULT_VENDOR_SHIPPING_SLA_HOURS,
    insuranceThresholdAmount: DEFAULT_INSURANCE_THRESHOLD,
    insuranceFeePercent: DEFAULT_INSURANCE_FEE_PERCENT,
    isEnabled: true,
  };
}

/**
 * Calculate protection fee for an order
 */
export async function calculateProtectionFee(
  orderValue: number,
  enableProtection: boolean,
  enableInsurance?: boolean
): Promise<CalculateProtectionFeeResult> {
  const settings = await getProtectionSettings();

  if (!settings.isEnabled || !enableProtection) {
    return {
      protectionFee: 0,
      insuranceFee: 0,
      totalFee: 0,
      isHighValue: false,
      protectionExpiresAt: null,
      shippingDeadline: new Date(Date.now() + settings.vendorShippingSLAHours * 60 * 60 * 1000),
    };
  }

  const protectionFee = (orderValue * settings.protectionFeePercent) / 100;
  const isHighValue = orderValue >= settings.insuranceThresholdAmount;
  let insuranceFee = 0;

  // Add insurance fee for high-value items when not explicitly disabled
  if (isHighValue && enableInsurance !== false) {
    insuranceFee = (orderValue * settings.insuranceFeePercent) / 100;
  }

  // Calculate protection expiry date (will be set after delivery)
  const protectionExpiresAt = null; // Set when order is delivered

  // Calculate shipping deadline
  const shippingDeadline = new Date(
    Date.now() + settings.vendorShippingSLAHours * 60 * 60 * 1000
  );

  return {
    protectionFee: Math.round(protectionFee * 100) / 100,
    insuranceFee: Math.round(insuranceFee * 100) / 100,
    totalFee: Math.round((protectionFee + insuranceFee) * 100) / 100,
    isHighValue,
    protectionExpiresAt,
    shippingDeadline,
  };
}

/**
 * Check if an order is eligible for buyer protection claim
 */
export async function isEligibleForClaim(
  orderId: string,
  userId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      protectionClaims: {
        where: {
          status: { in: ['pending', 'under_review', 'approved'] },
        },
      },
    },
  });

  if (!order) {
    return { eligible: false, reason: 'Order not found' };
  }

  if (!order.buyerProtectionEnabled) {
    return { eligible: false, reason: 'Buyer protection was not enabled for this order' };
  }

  // Check if there's already an active claim
  if (order.protectionClaims.length > 0) {
    return { eligible: false, reason: 'An active protection claim already exists for this order' };
  }

  // Check if protection has expired
  if (order.protectionExpiresAt && new Date() > order.protectionExpiresAt) {
    return { eligible: false, reason: 'Protection period has expired' };
  }

  // Check if order was delivered (for not_as_described claims)
  // For not_received claims, we check against shipping deadline
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return { eligible: false, reason: 'Order is already cancelled or refunded' };
  }

  return { eligible: true };
}

/**
 * File a protection claim
 */
export async function fileProtectionClaim(
  request: FileClaimRequest
): Promise<FileClaimResult> {
  const { orderId, userId, claimType, description, evidenceUrls = [] } = request;

  try {
    // Check eligibility
    const eligibility = await isEligibleForClaim(orderId, userId);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true, protectionFee: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Calculate refund amount (full order total - the protection fee is non-refundable)
    const requestedRefundAmount = Number(order.totalAmount) - Number(order.protectionFee || 0);

    const claim = await prisma.protectionClaim.create({
      data: {
        orderId,
        userId,
        claimType,
        description: description || null,
        evidenceUrls,
        requestedRefundAmount: new Prisma.Decimal(requestedRefundAmount),
        status: 'pending',
      },
    });

    return {
      success: true,
      claimId: claim.id,
    };
  } catch (error) {
    console.error('Error filing protection claim:', error);
    return { success: false, error: 'Failed to file protection claim' };
  }
}

/**
 * Process an approved protection claim and issue refund
 */
export async function processApprovedClaim(
  claimId: string,
  approvedAmount?: number
): Promise<ProcessClaimResult> {
  try {
    const claim = await prisma.protectionClaim.findUnique({
      where: { id: claimId },
      include: { order: true },
    });

    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }

    if (claim.status !== 'approved') {
      return { success: false, error: 'Claim is not approved' };
    }

    const refundAmount = approvedAmount || Number(claim.requestedRefundAmount);

    // Initiate refund
    const refundResult = await initiateRefund({
      orderId: claim.orderId,
      amount: refundAmount,
      reason: `Buyer Protection Claim: ${claim.claimType}`,
      restoreStock: true,
    });

    if (!refundResult.success) {
      return { success: false, error: refundResult.error };
    }

    // Process the refund
    if (refundResult.refundId) {
      await processRefund(refundResult.refundId);
    }

    // Update claim status
    await prisma.protectionClaim.update({
      where: { id: claimId },
      data: {
        status: 'refunded',
        approvedRefundAmount: new Prisma.Decimal(refundAmount),
        refundTransactionId: refundResult.refundId,
        refundedAt: new Date(),
      },
    });

    return {
      success: true,
      refundId: refundResult.refundId,
    };
  } catch (error) {
    console.error('Error processing approved claim:', error);
    return { success: false, error: 'Failed to process claim refund' };
  }
}

/**
 * Auto-refund orders where vendor hasn't shipped within SLA
 * This is called by a cron job
 */
export async function processAutoRefundsForSLAViolations(): Promise<{
  processed: number;
  refunded: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let refunded = 0;

  try {
    // Find orders with buyer protection that have passed shipping deadline
    // and are still in pending/confirmed status (not shipped)
    const overdueOrders = await prisma.order.findMany({
      where: {
        buyerProtectionEnabled: true,
        shippingDeadline: { lt: new Date() },
        status: { in: ['pending', 'paid', 'confirmed', 'processing'] },
        // Exclude orders that already have auto-refund claims
        protectionClaims: {
          none: {
            claimType: 'auto_refund_sla',
          },
        },
      },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        totalAmount: true,
        shippingDeadline: true,
      },
    });

    for (const order of overdueOrders) {
      processed++;

      try {
        // Create auto-refund claim
        const claim = await prisma.protectionClaim.create({
          data: {
            orderId: order.id,
            userId: order.userId!,
            claimType: 'auto_refund_sla',
            description: `Automatic refund: Vendor did not ship within SLA (deadline: ${order.shippingDeadline?.toISOString()})`,
            requestedRefundAmount: order.totalAmount,
            status: 'approved',
            reviewedAt: new Date(),
            resolution: 'Auto-approved due to vendor SLA violation',
          },
        });

        // Process the refund immediately
        const result = await processApprovedClaim(claim.id, Number(order.totalAmount));

        if (result.success) {
          refunded++;
          
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
              notes: `Cancelled and refunded automatically: Vendor did not ship within SLA`,
            },
          });
        } else {
          errors.push(`Order ${order.orderNumber}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Order ${order.orderNumber}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`General error: ${errorMessage}`);
  }

  return { processed, refunded, errors };
}

/**
 * Update protection expiry date when order is delivered
 */
export async function setProtectionExpiryOnDelivery(orderId: string): Promise<void> {
  const settings = await getProtectionSettings();

  const expiryDate = new Date(
    Date.now() + settings.protectionPeriodDays * 24 * 60 * 60 * 1000
  );

  await prisma.order.update({
    where: { id: orderId },
    data: { protectionExpiresAt: expiryDate },
  });
}

/**
 * Get protection claim by ID
 */
export async function getClaimById(claimId: string) {
  return prisma.protectionClaim.findUnique({
    where: { id: claimId },
    include: {
      order: {
        select: {
          orderNumber: true,
          totalAmount: true,
          protectionFee: true,
          userId: true,
          status: true,
        },
      },
    },
  });
}

/**
 * Get claims for a user
 */
export async function getUserClaims(userId: string, page = 1, perPage = 20) {
  const skip = (page - 1) * perPage;

  const [claims, total] = await Promise.all([
    prisma.protectionClaim.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.protectionClaim.count({ where: { userId } }),
  ]);

  return {
    claims,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

/**
 * Get claims for admin review
 */
export async function getAdminClaims(
  status?: string,
  page = 1,
  perPage = 20
) {
  const skip = (page - 1) * perPage;
  const where: Prisma.ProtectionClaimWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumProtectionClaimStatusFilter['equals'];
  }

  const [claims, total] = await Promise.all([
    prisma.protectionClaim.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            userId: true,
            user: {
              select: {
                email: true,
                profile: {
                  select: { displayName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.protectionClaim.count({ where }),
  ]);

  return {
    claims,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

/**
 * Update claim status (admin action)
 */
export async function updateClaimStatus(
  claimId: string,
  status: 'under_review' | 'approved' | 'rejected',
  adminUserId: string,
  resolution?: string,
  approvedAmount?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const claim = await prisma.protectionClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }

    if (claim.status === 'refunded') {
      return { success: false, error: 'Claim has already been refunded' };
    }

    const updateData: Prisma.ProtectionClaimUpdateInput = {
      status,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      resolution: resolution || null,
    };

    if (status === 'approved' && approvedAmount !== undefined) {
      updateData.approvedRefundAmount = new Prisma.Decimal(approvedAmount);
    }

    await prisma.protectionClaim.update({
      where: { id: claimId },
      data: updateData,
    });

    // If approved, process the refund automatically
    if (status === 'approved') {
      const refundResult = await processApprovedClaim(claimId, approvedAmount);
      if (!refundResult.success) {
        return { success: false, error: `Claim approved but refund failed: ${refundResult.error}` };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating claim status:', error);
    return { success: false, error: 'Failed to update claim status' };
  }
}
