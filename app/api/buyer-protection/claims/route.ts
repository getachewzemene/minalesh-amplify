import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';
import {
  fileProtectionClaim,
  getUserClaims,
  isEligibleForClaim,
} from '@/lib/buyer-protection';
import { z } from 'zod';

const claimSchema = z.object({
  orderId: z.string().uuid(),
  claimType: z.enum(['not_received', 'not_as_described']),
  description: z.string().min(10).max(2000).optional(),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
});

/**
 * @swagger
 * /api/buyer-protection/claims:
 *   post:
 *     summary: File a buyer protection claim
 *     description: File a new protection claim for an eligible order
 *     tags: [Buyer Protection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - claimType
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               claimType:
 *                 type: string
 *                 enum: [not_received, not_as_described]
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       201:
 *         description: Claim filed successfully
 *       400:
 *         description: Invalid request or order not eligible
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 *   get:
 *     summary: Get user's protection claims
 *     description: Retrieve all protection claims for the authenticated user
 *     tags: [Buyer Protection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of protection claims
 *       401:
 *         description: Unauthorized
 */

async function createClaimHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = claimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { orderId, claimType, description, evidenceUrls } = parsed.data;

    // Check eligibility first
    const eligibility = await isEligibleForClaim(orderId, user.userId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason || 'Order not eligible for protection claim' },
        { status: 400 }
      );
    }

    // File the claim
    const result = await fileProtectionClaim({
      orderId,
      userId: user.userId,
      claimType,
      description,
      evidenceUrls,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to file claim' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        claimId: result.claimId,
        message: 'Your protection claim has been submitted and will be reviewed within 24-48 hours.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating protection claim:', error);
    throw error;
  }
}

async function getClaimsHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);

    const result = await getUserClaims(user.userId, page, perPage);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching protection claims:', error);
    throw error;
  }
}

export const POST = withApiLogger(createClaimHandler);
export const GET = withApiLogger(getClaimsHandler);
