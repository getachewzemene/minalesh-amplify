import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

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

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
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

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
