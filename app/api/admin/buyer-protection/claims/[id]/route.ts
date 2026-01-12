import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';
import { getClaimById, updateClaimStatus } from '@/lib/buyer-protection';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  resolution: z.string().max(2000).optional(),
  approvedAmount: z.number().positive().optional(),
});

/**
 * @swagger
 * /api/admin/buyer-protection/claims/{id}:
 *   get:
 *     summary: Get claim details (Admin only)
 *     description: Get detailed information about a specific protection claim
 *     tags: [Admin - Buyer Protection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Claim details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Claim not found
 *   patch:
 *     summary: Update claim status (Admin only)
 *     description: Update the status of a protection claim (approve, reject, or mark under review)
 *     tags: [Admin - Buyer Protection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [under_review, approved, rejected]
 *               resolution:
 *                 type: string
 *                 maxLength: 2000
 *               approvedAmount:
 *                 type: number
 *                 description: Amount to refund (defaults to full amount if not specified)
 *     responses:
 *       200:
 *         description: Claim status updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Claim not found
 *       422:
 *         description: Validation error
 */

async function getClaimHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const claim = await getClaimById(id);

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error('Error fetching claim:', error);
    throw error;
  }
}

async function updateClaimHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { status, resolution, approvedAmount } = parsed.data;

    const result = await updateClaimStatus(
      id,
      status,
      user.userId,
      resolution,
      approvedAmount
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update claim' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Claim status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating claim:', error);
    throw error;
  }
}

export const GET = withApiLogger(getClaimHandler);
export const PATCH = withApiLogger(updateClaimHandler);
