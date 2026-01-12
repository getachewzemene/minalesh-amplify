import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';
import { getClaimById } from '@/lib/buyer-protection';

/**
 * @swagger
 * /api/buyer-protection/claims/{id}:
 *   get:
 *     summary: Get protection claim details
 *     description: Retrieve details of a specific protection claim
 *     tags: [Buyer Protection]
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
 *         description: Forbidden - not your claim
 *       404:
 *         description: Claim not found
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

    const { id } = await params;

    const claim = await getClaimById(id);

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Check if user owns this claim
    if (claim.userId !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view this claim' },
        { status: 403 }
      );
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error('Error fetching claim:', error);
    throw error;
  }
}

export const GET = withApiLogger(getClaimHandler);
