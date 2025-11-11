import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedShippingAndTax() {
  console.log('Seeding shipping zones, methods, rates, and tax rates...');

  // Create Shipping Zones for Ethiopia
  const addisAbabaZone = await prisma.shippingZone.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Addis Ababa',
      description: 'Capital city and surrounding areas',
      countries: ['ET'],
      regions: ['Addis Ababa'],
      cities: ['Addis Ababa'],
      isActive: true,
    },
  });

  const majorCitiesZone = await prisma.shippingZone.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Major Cities',
      description: 'Dire Dawa, Bahir Dar, Gondar, Mekelle, Hawassa, Adama',
      countries: ['ET'],
      cities: [
        'Dire Dawa',
        'Bahir Dar',
        'Gondar',
        'Mekelle',
        'Hawassa',
        'Adama',
        'Jimma',
        'Dessie',
        'Jijiga',
      ],
      isActive: true,
    },
  });

  const regionalZone = await prisma.shippingZone.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Regional Areas',
      description: 'Other cities and towns in Ethiopia',
      countries: ['ET'],
      isActive: true,
    },
  });

  console.log('Created shipping zones');

  // Create Shipping Methods
  const standardShipping = await prisma.shippingMethod.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'Standard Delivery',
      description: 'Regular delivery within estimated timeframe',
      carrier: 'Local Courier',
      estimatedDaysMin: 3,
      estimatedDaysMax: 7,
      isActive: true,
      sortOrder: 1,
    },
  });

  const expressShipping = await prisma.shippingMethod.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'Express Delivery',
      description: 'Fast delivery within 1-3 business days',
      carrier: 'Express Courier',
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      isActive: true,
      sortOrder: 2,
    },
  });

  const pickupMethod = await prisma.shippingMethod.upsert({
    where: { id: '00000000-0000-0000-0000-000000000013' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      name: 'Store Pickup',
      description: 'Pick up from our store location',
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log('Created shipping methods');

  // Create Shipping Rates
  // Addis Ababa rates
  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000021',
      zoneId: addisAbabaZone.id,
      methodId: standardShipping.id,
      baseRate: 50,
      perKgRate: 10,
      freeShippingThreshold: 1000,
      isActive: true,
    },
  });

  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000022' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000022',
      zoneId: addisAbabaZone.id,
      methodId: expressShipping.id,
      baseRate: 100,
      perKgRate: 20,
      freeShippingThreshold: 2000,
      isActive: true,
    },
  });

  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000023' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000023',
      zoneId: addisAbabaZone.id,
      methodId: pickupMethod.id,
      baseRate: 0,
      isActive: true,
    },
  });

  // Major Cities rates
  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000024' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000024',
      zoneId: majorCitiesZone.id,
      methodId: standardShipping.id,
      baseRate: 100,
      perKgRate: 15,
      freeShippingThreshold: 1500,
      isActive: true,
    },
  });

  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000025' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000025',
      zoneId: majorCitiesZone.id,
      methodId: expressShipping.id,
      baseRate: 200,
      perKgRate: 25,
      freeShippingThreshold: 3000,
      isActive: true,
    },
  });

  // Regional rates
  await prisma.shippingRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000026' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000026',
      zoneId: regionalZone.id,
      methodId: standardShipping.id,
      baseRate: 150,
      perKgRate: 20,
      freeShippingThreshold: 2000,
      isActive: true,
    },
  });

  console.log('Created shipping rates');

  // Create Tax Rates
  // Ethiopian VAT - 15%
  await prisma.taxRate.upsert({
    where: { id: '00000000-0000-0000-0000-000000000031' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000031',
      name: 'Ethiopian VAT',
      description: 'Standard Value Added Tax in Ethiopia',
      rate: 0.15,
      country: 'ET',
      taxType: 'VAT',
      isCompound: false,
      isActive: true,
      priority: 1,
    },
  });

  // Regional tax rates can be added here if needed
  // For now, Ethiopia uses a uniform VAT rate across all regions

  console.log('Created tax rates');

  console.log('✅ Shipping and tax seed completed successfully!');
}

seedShippingAndTax()
  .catch((e) => {
    console.error('Error seeding shipping and tax:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
