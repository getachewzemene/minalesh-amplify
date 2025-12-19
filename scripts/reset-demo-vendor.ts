import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

async function run() {
  const prisma = new PrismaClient();
  const email = 'demo.vendor@minalesh.com';
  const plainPassword = 'DemoVendor123!';

  try {
    console.log(`🔎 Looking up demo vendor: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error('❌ Demo vendor user not found. Run `npm run seed:demo` first.');
      process.exit(1);
    }

    const hashedPassword = await hash(plainPassword, 10);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockoutUntil: null,
      },
      include: { profile: true },
    });

    console.log('✅ Demo vendor reset complete:');
    console.log({
      id: updated.id,
      email: updated.email,
      role: updated.role,
      loginAttempts: updated.loginAttempts,
      lockoutUntil: updated.lockoutUntil,
      vendorStatus: updated.profile?.vendorStatus,
    });

    console.log('\nNow try logging in at /auth/login with:');
    console.log('  Email:    demo.vendor@minalesh.com');
    console.log('  Password: DemoVendor123!');
  } catch (err) {
    console.error('❌ Error resetting demo vendor:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
