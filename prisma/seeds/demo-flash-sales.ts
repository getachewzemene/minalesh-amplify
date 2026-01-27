/**
 * Demo Flash Sales Seed Script
 * 
 * Creates sample flash sales for testing the Enhanced Flash Sales feature.
 * Run with: npx tsx prisma/seeds/demo-flash-sales.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔥 Seeding demo flash sales...');

  // First, get some existing products
  const products = await prisma.product.findMany({
    take: 5,
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (products.length === 0) {
    console.log('❌ No products found. Please run demo-products seed first.');
    return;
  }

  // Clear existing flash sales
  await prisma.flashSale.deleteMany({});
  console.log('✅ Cleared existing flash sales');

  const now = new Date();
  
  // Create upcoming flash sale (starts in 1 hour)
  const upcomingSale = await prisma.flashSale.create({
    data: {
      name: 'Upcoming Flash Sale - ' + products[0].name,
      description: 'Get ready for amazing deals! Sale starts in 1 hour.',
      productId: products[0].id,
      discountType: 'percentage',
      discountValue: 30,
      originalPrice: products[0].price,
      flashPrice: Number(products[0].price) * 0.7,
      stockLimit: 50,
      stockSold: 0,
      startsAt: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
      endsAt: new Date(now.getTime() + 13 * 60 * 60 * 1000), // 13 hours from now
      isActive: true,
    },
  });
  console.log(`✅ Created upcoming flash sale: ${upcomingSale.name}`);

  // Create active flash sale (started 1 hour ago, ends in 5 hours)
  if (products[1]) {
    const activeSale = await prisma.flashSale.create({
      data: {
        name: 'Active Flash Sale - ' + products[1].name,
        description: 'Limited time offer! Grab it before it\'s gone!',
        productId: products[1].id,
        discountType: 'percentage',
        discountValue: 40,
        originalPrice: products[1].price,
        flashPrice: Number(products[1].price) * 0.6,
        stockLimit: 100,
        stockSold: 35, // 35 already sold
        startsAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Started 1 hour ago
        endsAt: new Date(now.getTime() + 5 * 60 * 60 * 1000), // Ends in 5 hours
        isActive: true,
      },
    });
    console.log(`✅ Created active flash sale: ${activeSale.name}`);
  }

  // Create another active flash sale (almost sold out)
  if (products[2]) {
    const almostSoldOutSale = await prisma.flashSale.create({
      data: {
        name: 'Hot Deal - ' + products[2].name,
        description: 'Almost sold out! Only a few items left!',
        productId: products[2].id,
        discountType: 'fixed_amount',
        discountValue: 500,
        originalPrice: products[2].price,
        flashPrice: Number(products[2].price) - 500,
        stockLimit: 20,
        stockSold: 18, // 90% sold
        startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Ends in 2 hours
        isActive: true,
      },
    });
    console.log(`✅ Created almost sold out flash sale: ${almostSoldOutSale.name}`);
  }

  // Create another upcoming flash sale (starts tomorrow)
  if (products[3]) {
    const tomorrowSale = await prisma.flashSale.create({
      data: {
        name: 'Tomorrow\'s Special - ' + products[3].name,
        description: 'Register now to be notified when this sale starts!',
        productId: products[3].id,
        discountType: 'percentage',
        discountValue: 25,
        originalPrice: products[3].price,
        flashPrice: Number(products[3].price) * 0.75,
        stockLimit: 75,
        stockSold: 0,
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        endsAt: new Date(now.getTime() + 36 * 60 * 60 * 1000), // Tomorrow + 12 hours
        isActive: true,
      },
    });
    console.log(`✅ Created tomorrow's flash sale: ${tomorrowSale.name}`);
  }

  // Create an ended flash sale
  if (products[4]) {
    const endedSale = await prisma.flashSale.create({
      data: {
        name: 'Ended Sale - ' + products[4].name,
        description: 'This sale has ended. Check back for more deals!',
        productId: products[4].id,
        discountType: 'percentage',
        discountValue: 35,
        originalPrice: products[4].price,
        flashPrice: Number(products[4].price) * 0.65,
        stockLimit: 60,
        stockSold: 60, // Completely sold out
        startsAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        endsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        isActive: false,
      },
    });
    console.log(`✅ Created ended flash sale: ${endedSale.name}`);
  }

  console.log('\n🎉 Demo flash sales seeded successfully!');
  console.log('\n📋 Summary:');
  console.log('  - 1 upcoming flash sale (starts in 1 hour)');
  console.log('  - 2 active flash sales (in progress)');
  console.log('  - 1 future flash sale (starts tomorrow)');
  console.log('  - 1 ended flash sale');
  console.log('\n🚀 Visit http://localhost:3000/flash-sales to see them!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding flash sales:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
