import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out' })
  // Clear the auth cookie
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
import { NextResponse } from 'next/server';

export async function POST() {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint is here for consistency with the original API
  return NextResponse.json({ message: 'Logout successful' });
}
