import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';

/**
 * @swagger
 * /api/user/data-export/download:
 *   get:
 *     summary: Download exported user data
 *     description: Download the exported data file if ready
 *     tags: [User, Privacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Export request ID
 *     responses:
 *       200:
 *         description: Download URL or file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Request not found or not ready
 */

async function downloadExportHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const exportRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: requestId,
        userId: user.userId,
      },
    });

    if (!exportRequest) {
      return NextResponse.json(
        { error: 'Export request not found' },
        { status: 404 }
      );
    }

    if (exportRequest.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Export is not ready yet',
          status: exportRequest.status,
        },
        { status: 400 }
      );
    }

    // Check if download link has expired
    if (new Date() > exportRequest.expiresAt) {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'expired' },
      });

      return NextResponse.json(
        { error: 'Download link has expired' },
        { status: 410 }
      );
    }

    if (!exportRequest.downloadUrl) {
      return NextResponse.json(
        { error: 'Download URL not available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      downloadUrl: exportRequest.downloadUrl,
      expiresAt: exportRequest.expiresAt,
      fileSize: exportRequest.fileSize,
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    throw error;
  }
}

export const GET = withApiLogger(downloadExportHandler);
