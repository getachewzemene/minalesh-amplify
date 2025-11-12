import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  isAccountLockedOut,
  shouldResetLoginAttempts,
  calculateLockoutTime
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked out
    if (isAccountLockedOut(user.lockoutUntil)) {
      const remainingTime = Math.ceil((user.lockoutUntil!.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account locked. Please try again in ${remainingTime} minutes.` },
        { status: 429 }
      );
    }

    // Reset login attempts if lockout period has passed
    if (shouldResetLoginAttempts(user.loginAttempts, user.lockoutUntil)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
      user.loginAttempts = 0;
      user.lockoutUntil = null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      const updateData: any = { loginAttempts: newAttempts };

      // Lock account if max attempts reached
      if (newAttempts >= 5) {
        updateData.lockoutUntil = calculateLockoutTime();
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (newAttempts >= 5) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Account locked for 15 minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid credentials', attemptsRemaining: 5 - newAttempts },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockoutUntil: null },
    });

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
      message: 'Login successful',
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
