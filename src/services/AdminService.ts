/**
 * Admin Service
 * Handles admin user management with single admin constraint
 */

import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Check if an admin user already exists in the system
 */
export async function adminExists(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { role: 'admin' },
  });
  return count > 0;
}

/**
 * Get the current admin user if one exists
 */
export async function getAdmin() {
  return await prisma.user.findFirst({
    where: { role: 'admin' },
    include: { profile: true },
  });
}

/**
 * Validate that creating/updating a user to admin role doesn't violate the single admin constraint
 * @param userId - The user ID being updated (null for new users)
 * @param newRole - The role being set
 * @throws Error if attempting to create a second admin
 */
export async function validateSingleAdminConstraint(userId: string | null, newRole: UserRole): Promise<void> {
  if (newRole !== 'admin') {
    return; // Not setting to admin, no constraint to check
  }

  const currentAdmin = await getAdmin();
  
  if (!currentAdmin) {
    return; // No admin exists, safe to create one
  }

  // If updating an existing user
  if (userId && currentAdmin.id === userId) {
    return; // User is already the admin, safe to keep as admin
  }

  // Attempting to create a second admin
  throw new Error('Only one admin user is allowed in the system. Current admin: ' + currentAdmin.email);
}
