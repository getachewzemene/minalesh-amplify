import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateRefreshToken, generateRandomToken } from '@/lib/auth';
import { sendEmail, createEmailVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password, displayName, firstName, lastName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength (min 8 chars, at least one letter and one number)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerificationToken,
        profile: {
          create: {
            displayName: displayName || email,
            firstName,
            lastName,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Send email verification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailTemplate = createEmailVerificationEmail(user.email, emailVerificationToken, appUrl);
    await sendEmail(emailTemplate);

    // Generate JWT tokens
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    });
    const refreshToken = generateRefreshToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
