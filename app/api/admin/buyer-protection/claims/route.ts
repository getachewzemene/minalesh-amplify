import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import { withApiLogger } from '@/lib/api-logger';
import { getAdminClaims } from '@/lib/buyer-protection';

/**
 * @swagger
 * /api/admin/buyer-protection/claims:
 *   get:
 *     summary: Get all protection claims (Admin only)
 *     description: Retrieve all protection claims for admin review
 *     tags: [Admin - Buyer Protection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, refunded, cancelled]
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
 *       403:
 *         description: Forbidden - Admin only
 */

async function getClaimsHandler(request: Request): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);

    const result = await getAdminClaims(status, page, perPage);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin claims:', error);
    throw error;
  }
}

export const GET = withApiLogger(getClaimsHandler);
