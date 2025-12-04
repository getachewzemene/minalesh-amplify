import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

/**
 * Get the JWT secret, checking for production requirements.
 * Uses lazy evaluation to avoid errors during build time.
 */
function getJwtSecret(): Secret {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  return process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
}

function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

function getRefreshTokenExpiresIn(): string {
  return process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
}

// Max login attempts before lockout
const MAX_LOGIN_ATTEMPTS = 5;
// Lockout duration in minutes
const LOCKOUT_DURATION_MINUTES = 15;

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  const options: jwt.SignOptions = { expiresIn: getJwtExpiresIn() as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function generateRefreshToken(payload: JWTPayload): string {
  const options: jwt.SignOptions = { expiresIn: getRefreshTokenExpiresIn() as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function getUserFromToken(token: string | null): JWTPayload | null {
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Check if user has the specified role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user is a vendor
 */
export function isVendor(role: UserRole): boolean {
  return role === 'vendor' || role === 'admin';
}

/**
 * Check if user is a customer (or has any valid role)
 */
export function isCustomer(role: UserRole): boolean {
  return role === 'customer' || role === 'vendor' || role === 'admin';
}

/**
 * Generate a cryptographically secure random token for email verification or password reset
 */
export function generateRandomToken(): string {
  // Use crypto.randomBytes for cryptographically secure random values
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Modern approach: use crypto.randomUUID() which is available in Node.js 14.17+
    return crypto.randomUUID().replace(/-/g, '');
  } else {
    // Fallback for older Node.js versions: use crypto.randomBytes
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * Get lockout time for failed login attempts
 */
export function calculateLockoutTime(): Date {
  const lockoutTime = new Date();
  lockoutTime.setMinutes(lockoutTime.getMinutes() + LOCKOUT_DURATION_MINUTES);
  return lockoutTime;
}

/**
 * Check if account is currently locked out
 */
export function isAccountLockedOut(lockoutUntil: Date | null): boolean {
  if (!lockoutUntil) return false;
  return new Date() < lockoutUntil;
}

/**
 * Check if login attempts should reset lockout
 */
export function shouldResetLoginAttempts(loginAttempts: number, lockoutUntil: Date | null): boolean {
  return loginAttempts >= MAX_LOGIN_ATTEMPTS && (!lockoutUntil || new Date() >= lockoutUntil);
}

