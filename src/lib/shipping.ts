import prisma from './prisma';

export interface ShippingAddress {
  country: string;
  region?: string;
  city?: string;
  postalCode?: string;
}

export interface ShippingOption {
  id: string;
  zoneId: string;
  methodId: string;
  name: string;
  description?: string;
  carrier?: string;
  rate: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
}

export interface ShippingCalculationResult {
  options: ShippingOption[];
  cheapestOption?: ShippingOption;
  fastestOption?: ShippingOption;
}

/**
 * Find matching shipping zone for an address
 */
export async function findShippingZone(
  address: ShippingAddress
): Promise<string | null> {
  const zones = await prisma.shippingZone.findMany({
    where: { isActive: true },
  });

  for (const zone of zones) {
    const countries = zone.countries as string[];
    const regions = zone.regions as string[];
    const cities = zone.cities as string[];
    const postalCodes = zone.postalCodes as string[];

    // Check country match
    if (!countries.includes(address.country)) {
      continue;
    }

    // If zone has specific regions, check if address region matches
    if (regions.length > 0 && address.region) {
      if (!regions.includes(address.region)) {
        continue;
      }
    }

    // If zone has specific cities, check if address city matches
    if (cities.length > 0 && address.city) {
      if (!cities.includes(address.city)) {
        continue;
      }
    }

    // If zone has specific postal codes, check if address postal code matches
    if (postalCodes.length > 0 && address.postalCode) {
      if (!postalCodes.includes(address.postalCode)) {
        continue;
      }
    }

    return zone.id;
  }

  return null;
}

/**
 * Calculate shipping rate based on order details
 */
export function calculateShippingRate(
  baseRate: number,
  perKgRate: number | null,
  weight: number | null,
  subtotal: number,
  freeShippingThreshold: number | null
): number {
  // Check if order qualifies for free shipping
  if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
    return 0;
  }

  let rate = baseRate;

  // Add weight-based rate if applicable
  if (perKgRate && weight) {
    rate += perKgRate * weight;
  }

  return rate;
}

/**
 * Get available shipping options for an address and order
 */
export async function getShippingOptions(
  address: ShippingAddress,
  subtotal: number,
  totalWeight?: number
): Promise<ShippingCalculationResult> {
  // Find matching zone
  const zoneId = await findShippingZone(address);

  if (!zoneId) {
    return {
      options: [],
    };
  }

  // Get shipping rates for this zone
  const shippingRates = await prisma.shippingRate.findMany({
    where: {
      zoneId,
      isActive: true,
      OR: [
        { minOrderAmount: null },
        { minOrderAmount: { lte: subtotal } },
      ],
      AND: [
        {
          OR: [
            { maxOrderAmount: null },
            { maxOrderAmount: { gte: subtotal } },
          ],
        },
      ],
    },
    include: {
      method: true,
      zone: true,
    },
    orderBy: {
      method: {
        sortOrder: 'asc',
      },
    },
  });

  const options: ShippingOption[] = shippingRates
    .filter((rate) => rate.method.isActive)
    .map((rate) => {
      const calculatedRate = calculateShippingRate(
        Number(rate.baseRate),
        rate.perKgRate ? Number(rate.perKgRate) : null,
        totalWeight || null,
        subtotal,
        rate.freeShippingThreshold ? Number(rate.freeShippingThreshold) : null
      );

      return {
        id: rate.id,
        zoneId: rate.zoneId,
        methodId: rate.methodId,
        name: rate.method.name,
        description: rate.method.description || undefined,
        carrier: rate.method.carrier || undefined,
        rate: calculatedRate,
        estimatedDaysMin: rate.method.estimatedDaysMin || undefined,
        estimatedDaysMax: rate.method.estimatedDaysMax || undefined,
      };
    });

  // Find cheapest and fastest options
  const cheapestOption = options.reduce((prev, current) =>
    current.rate < prev.rate ? current : prev
  , options[0]);

  const fastestOption = options.reduce((prev, current) => {
    const prevMax = prev.estimatedDaysMax || Infinity;
    const currentMax = current.estimatedDaysMax || Infinity;
    return currentMax < prevMax ? current : prev;
  }, options[0]);

  return {
    options,
    cheapestOption,
    fastestOption,
  };
}

/**
 * Get shipping rate by ID
 */
export async function getShippingRateById(
  rateId: string
): Promise<ShippingOption | null> {
  const rate = await prisma.shippingRate.findUnique({
    where: { id: rateId },
    include: {
      method: true,
      zone: true,
    },
  });

  if (!rate) {
    return null;
  }

  return {
    id: rate.id,
    zoneId: rate.zoneId,
    methodId: rate.methodId,
    name: rate.method.name,
    description: rate.method.description || undefined,
    carrier: rate.method.carrier || undefined,
    rate: Number(rate.baseRate),
    estimatedDaysMin: rate.method.estimatedDaysMin || undefined,
    estimatedDaysMax: rate.method.estimatedDaysMax || undefined,
  };
}

/**
 * Ethiopian shipping zones helper - creates default zones for Ethiopia
 */
export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'Southern Nations, Nationalities, and Peoples',
  'Tigray',
];

export const ETHIOPIAN_MAJOR_CITIES = [
  'Addis Ababa',
  'Dire Dawa',
  'Mekelle',
  'Gondar',
  'Bahir Dar',
  'Hawassa',
  'Adama',
  'Jimma',
  'Dessie',
  'Jijiga',
];
