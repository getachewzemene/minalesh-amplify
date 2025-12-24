#!/usr/bin/env tsx

/**
 * Script to initialize the admin user in the database
 * Usage: npx tsx scripts/init-admin.ts
 * 
 * This script will:
 * 1. Check if an admin already exists
 * 2. If not, create an admin user with the provided credentials
 * 3. If yes, display the existing admin email
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { validateSingleAdminConstraint } from '../src/services/AdminService';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function initAdmin() {
  try {
    console.log('🔍 Checking for existing admin...\n');

    // Check if an admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
      include: { profile: true },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Created: ${existingAdmin.createdAt.toISOString()}`);
      console.log('\n⚠️  Only one admin is allowed in the system.');
      console.log('   To change the admin, manually update the database.');
      return;
    }

    console.log('📝 No admin found. Let\'s create one!\n');

    // Get admin details from user input
    const email = await question('Admin Email: ');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email address format');
    }

    const password = await question('Admin Password (min 8 characters): ');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const firstName = await question('First Name (optional): ');
    const lastName = await question('Last Name (optional): ');

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin
      console.log('\n⚠️  User with this email already exists. Upgrading to admin...');
      
      // Validate single admin constraint
      await validateSingleAdminConstraint(existingUser.id, 'admin');
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
        include: { profile: true },
      });

      // Update profile if needed
      if (updatedUser.profile && (firstName || lastName)) {
        await prisma.profile.update({
          where: { id: updatedUser.profile.id },
          data: {
            firstName: firstName || updatedUser.profile.firstName,
            lastName: lastName || updatedUser.profile.lastName,
          },
        });
      }

      console.log('\n✅ Admin user upgraded successfully!');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
    } else {
      // Create new admin user
      console.log('\n🔐 Creating admin user...');
      
      const hashedPassword = await hashPassword(password);
      
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'admin',
          emailVerified: new Date(),
          profile: {
            create: {
              displayName: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
              firstName: firstName || null,
              lastName: lastName || null,
            },
          },
        },
        include: { profile: true },
      });

      console.log('\n✅ Admin user created successfully!');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Display Name: ${admin.profile?.displayName}`);
    }

    console.log('\n🎉 You can now login at /admin/login with these credentials.\n');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
initAdmin();
