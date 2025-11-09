import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Ethiopian marketplace categories...');

  // Ethiopian-specific categories
  const categories = [
    {
      name: 'Traditional Clothing',
      slug: 'traditional-clothing',
      description: 'Authentic Ethiopian traditional clothing and accessories',
      sortOrder: 1,
    },
    {
      name: 'Coffee & Tea',
      slug: 'coffee-tea',
      description: 'Ethiopian coffee, tea, and traditional beverage products',
      sortOrder: 2,
    },
    {
      name: 'Spices & Ingredients',
      slug: 'spices-ingredients',
      description: 'Traditional Ethiopian spices, berbere, mitmita, and cooking ingredients',
      sortOrder: 3,
    },
    {
      name: 'Handicrafts & Art',
      slug: 'handicrafts-art',
      description: 'Handmade Ethiopian crafts, pottery, baskets, and artwork',
      sortOrder: 4,
    },
    {
      name: 'Jewelry & Accessories',
      slug: 'jewelry-accessories',
      description: 'Traditional and modern Ethiopian jewelry and accessories',
      sortOrder: 5,
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Mobile phones, laptops, and electronic devices',
      sortOrder: 6,
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home appliances, kitchenware, and household items',
      sortOrder: 7,
    },
    {
      name: 'Fashion & Beauty',
      slug: 'fashion-beauty',
      description: 'Modern fashion, clothing, and beauty products',
      sortOrder: 8,
    },
    {
      name: 'Books & Education',
      slug: 'books-education',
      description: 'Books, educational materials, and learning resources',
      sortOrder: 9,
    },
    {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      description: 'Health products, supplements, and wellness items',
      sortOrder: 10,
    },
    {
      name: 'Sports & Outdoor',
      slug: 'sports-outdoor',
      description: 'Sports equipment, fitness gear, and outdoor products',
      sortOrder: 11,
    },
    {
      name: 'Baby & Kids',
      slug: 'baby-kids',
      description: 'Products for babies, children, and parenting',
      sortOrder: 12,
    },
    {
      name: 'Automotive',
      slug: 'automotive',
      description: 'Car accessories, parts, and automotive products',
      sortOrder: 13,
    },
    {
      name: 'Agriculture & Farming',
      slug: 'agriculture-farming',
      description: 'Agricultural tools, seeds, and farming supplies',
      sortOrder: 14,
    },
    {
      name: 'Religious Items',
      slug: 'religious-items',
      description: 'Religious books, icons, crosses, and spiritual items',
      sortOrder: 15,
    },
  ];

  // Create parent categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`✓ Created category: ${category.name}`);
  }

  // Create subcategories
  const traditionalClothingCategory = await prisma.category.findUnique({
    where: { slug: 'traditional-clothing' },
  });

  const coffeeCategory = await prisma.category.findUnique({
    where: { slug: 'coffee-tea' },
  });

  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' },
  });

  if (traditionalClothingCategory) {
    const subcategories = [
      {
        name: 'Habesha Kemis',
        slug: 'habesha-kemis',
        description: 'Traditional Ethiopian dresses',
        parentId: traditionalClothingCategory.id,
        sortOrder: 1,
      },
      {
        name: 'Netela',
        slug: 'netela',
        description: 'Traditional Ethiopian shawls',
        parentId: traditionalClothingCategory.id,
        sortOrder: 2,
      },
      {
        name: 'Men\'s Traditional Wear',
        slug: 'mens-traditional-wear',
        description: 'Traditional Ethiopian clothing for men',
        parentId: traditionalClothingCategory.id,
        sortOrder: 3,
      },
    ];

    for (const subcat of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcat.slug },
        update: subcat,
        create: subcat,
      });
      console.log(`  ✓ Created subcategory: ${subcat.name}`);
    }
  }

  if (coffeeCategory) {
    const subcategories = [
      {
        name: 'Ethiopian Coffee Beans',
        slug: 'ethiopian-coffee-beans',
        description: 'Arabica coffee from Ethiopian regions',
        parentId: coffeeCategory.id,
        sortOrder: 1,
      },
      {
        name: 'Jebena',
        slug: 'jebena',
        description: 'Traditional Ethiopian coffee pots',
        parentId: coffeeCategory.id,
        sortOrder: 2,
      },
      {
        name: 'Tea Products',
        slug: 'tea-products',
        description: 'Ethiopian tea and herbal beverages',
        parentId: coffeeCategory.id,
        sortOrder: 3,
      },
    ];

    for (const subcat of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcat.slug },
        update: subcat,
        create: subcat,
      });
      console.log(`  ✓ Created subcategory: ${subcat.name}`);
    }
  }

  if (electronicsCategory) {
    const subcategories = [
      {
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        description: 'Smartphones and mobile devices',
        parentId: electronicsCategory.id,
        sortOrder: 1,
      },
      {
        name: 'Laptops & Computers',
        slug: 'laptops-computers',
        description: 'Laptops, desktops, and computer accessories',
        parentId: electronicsCategory.id,
        sortOrder: 2,
      },
      {
        name: 'Audio & Video',
        slug: 'audio-video',
        description: 'Headphones, speakers, and audio equipment',
        parentId: electronicsCategory.id,
        sortOrder: 3,
      },
    ];

    for (const subcat of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcat.slug },
        update: subcat,
        create: subcat,
      });
      console.log(`  ✓ Created subcategory: ${subcat.name}`);
    }
  }

  // Add Spices & Ingredients subcategories
  const spicesCategory = await prisma.category.findUnique({
    where: { slug: 'spices-ingredients' },
  });

  if (spicesCategory) {
    const subcategories = [
      {
        name: 'Berbere',
        slug: 'berbere',
        description: 'Traditional Ethiopian spice blend',
        parentId: spicesCategory.id,
        sortOrder: 1,
      },
      {
        name: 'Mitmita',
        slug: 'mitmita',
        description: 'Spicy Ethiopian chili powder blend',
        parentId: spicesCategory.id,
        sortOrder: 2,
      },
      {
        name: 'Cooking Ingredients',
        slug: 'cooking-ingredients',
        description: 'Traditional Ethiopian cooking ingredients',
        parentId: spicesCategory.id,
        sortOrder: 3,
      },
    ];

    for (const subcat of subcategories) {
      await prisma.category.upsert({
        where: { slug: subcat.slug },
        update: subcat,
        create: subcat,
      });
      console.log(`  ✓ Created subcategory: ${subcat.name}`);
    }
  }

  console.log('\n✅ Ethiopian marketplace categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
