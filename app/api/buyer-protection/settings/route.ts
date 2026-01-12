import { NextResponse } from 'next/server';
import { withApiLogger } from '@/lib/api-logger';
import { getProtectionSettings, calculateProtectionFee } from '@/lib/buyer-protection';

/**
 * @swagger
 * /api/buyer-protection/settings:
 *   get:
 *     summary: Get buyer protection settings
 *     description: Get the current buyer protection settings for checkout display
 *     tags: [Buyer Protection]
 *     parameters:
 *       - in: query
 *         name: orderValue
 *         schema:
 *           type: number
 *         description: Optional order value to calculate fees
 *     responses:
 *       200:
 *         description: Buyer protection settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     protectionFeePercent:
 *                       type: number
 *                     protectionPeriodDays:
 *                       type: number
 *                     vendorShippingSLAHours:
 *                       type: number
 *                     insuranceThresholdAmount:
 *                       type: number
 *                     insuranceFeePercent:
 *                       type: number
 *                     isEnabled:
 *                       type: boolean
 *                 estimate:
 *                   type: object
 *                   description: Fee estimate for given order value
 */

async function getSettingsHandler(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const orderValueParam = searchParams.get('orderValue');

    const settings = await getProtectionSettings();

    let estimate = null;
    if (orderValueParam) {
      const orderValue = parseFloat(orderValueParam);
      if (!isNaN(orderValue) && orderValue > 0) {
        estimate = await calculateProtectionFee(orderValue, true, undefined);
      }
    }

    return NextResponse.json({
      settings: {
        protectionFeePercent: settings.protectionFeePercent,
        protectionPeriodDays: settings.protectionPeriodDays,
        vendorShippingSLAHours: settings.vendorShippingSLAHours,
        insuranceThresholdAmount: settings.insuranceThresholdAmount,
        insuranceFeePercent: settings.insuranceFeePercent,
        isEnabled: settings.isEnabled,
      },
      estimate,
    });
  } catch (error) {
    console.error('Error fetching buyer protection settings:', error);
    throw error;
  }
}

export const GET = withApiLogger(getSettingsHandler);
