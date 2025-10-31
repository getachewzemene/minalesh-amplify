import { NextResponse } from 'next/server';

export async function POST() {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint is here for consistency with the original API
  return NextResponse.json({ message: 'Logout successful' });
}
