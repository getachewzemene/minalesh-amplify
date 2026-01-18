import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queueEmail, createWelcomeSeriesEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: { 
        emailVerificationToken: token,
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email already verified',
      });
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
      },
    });

    // Send welcome series email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const userName = user.profile?.firstName || user.email.split('@')[0];
      const exploreUrl = `${appUrl}/products`;
      const accountUrl = `${appUrl}/account`;

      await queueEmail(
        createWelcomeSeriesEmail(
          user.email,
          userName,
          exploreUrl,
          accountUrl
        )
      );
    } catch (emailError) {
      // Log but don't fail the verification if email fails
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying your email' },
      { status: 500 }
    );
  }
}
