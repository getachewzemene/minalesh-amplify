import { NextResponse } from 'next/server';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { withApiLogger } from '@/lib/api-logger';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/user/account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete user account and associated data (GDPR compliance)
 *     tags: [User, Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmation
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's current password for verification
 *               confirmation:
 *                 type: string
 *                 description: Must be exactly "DELETE MY ACCOUNT"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Invalid request or active orders exist
 *       401:
 *         description: Unauthorized or incorrect password
 */

async function deleteAccountHandler(request: Request): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(request);
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password, confirmation } = body;

    if (!password || !confirmation) {
      return NextResponse.json(
        { error: 'Password and confirmation are required' },
        { status: 400 }
      );
    }

    // Verify confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type exactly: DELETE MY ACCOUNT' },
        { status: 400 }
      );
    }

    // Verify password
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { password: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Check for active orders
    const activeOrders = await prisma.order.findMany({
      where: {
        userId: user.userId,
        status: {
          in: ['pending', 'paid', 'confirmed', 'processing', 'shipped'],
        },
      },
    });

    if (activeOrders.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with active orders. Please wait for all orders to be completed or cancelled.',
          activeOrdersCount: activeOrders.length,
        },
        { status: 400 }
      );
    }

    // Get user info before deletion for confirmation email
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { 
        email: true,
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Start transaction for account deletion
    await prisma.$transaction(async (tx) => {
      // Anonymize reviews instead of deleting (to preserve product ratings)
      await tx.review.updateMany({
        where: { userId: user.userId },
        data: {
          comment: '[User account deleted]',
          images: [],
        },
      });

      // Delete wishlist items
      await tx.wishlist.deleteMany({
        where: { userId: user.userId },
      });

      // Delete cart items
      await tx.cart.deleteMany({
        where: { userId: user.userId },
      });

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: user.userId },
      });

      // Delete data export requests
      await tx.dataExportRequest.deleteMany({
        where: { userId: user.userId },
      });

      // Delete user preferences
      await tx.userPreferences.deleteMany({
        where: { userId: user.userId },
      });

      // Delete notification preferences
      await tx.notificationPreference.deleteMany({
        where: { userId: user.userId },
      });

      // Delete loyalty account and transactions
      const loyaltyAccount = await tx.loyaltyAccount.findUnique({
        where: { userId: user.userId },
      });
      
      if (loyaltyAccount) {
        await tx.loyaltyTransaction.deleteMany({
          where: { accountId: loyaltyAccount.id },
        });
        await tx.loyaltyAccount.delete({
          where: { id: loyaltyAccount.id },
        });
      }

      // Delete referrals
      await tx.referral.deleteMany({
        where: {
          OR: [
            { referrerId: user.userId },
            { refereeId: user.userId },
          ],
        },
      });

      // Delete product comparisons
      await tx.productComparison.deleteMany({
        where: { userId: user.userId },
      });

      // Note: Keep orders and order history for tax/legal compliance (7 years)
      // These will be anonymized by removing the userId reference
      await tx.order.updateMany({
        where: { userId: user.userId },
        data: { userId: null },
      });

      // Delete profile (cascade will handle addresses)
      await tx.profile.deleteMany({
        where: { userId: user.userId },
      });

      // Finally, delete the user account
      await tx.user.delete({
        where: { id: user.userId },
      });
    });

    // Send account deletion confirmation email
    if (userInfo) {
      const { queueEmail, createAccountDeletionConfirmationEmail } = await import('@/lib/email');
      const displayName = userInfo.profile?.displayName || userInfo.email.split('@')[0];
      const emailTemplate = createAccountDeletionConfirmationEmail(
        userInfo.email,
        displayName
      );
      await queueEmail(emailTemplate);
    }

    return NextResponse.json({
      message: 'Account deleted successfully. We are sorry to see you go.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

export const DELETE = withApiLogger(deleteAccountHandler);
