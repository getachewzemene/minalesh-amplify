/**
 * Warehouse selection and routing utilities
 * Helps determine optimal warehouse for order fulfillment
 */

import prisma from '@/lib/prisma';

interface Location {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
    Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the nearest warehouse to a delivery location
 */
export async function findNearestWarehouse(
  deliveryLocation: Location,
  options: {
    city?: string;
    includeInactive?: boolean;
  } = {}
): Promise<(typeof prisma.warehouse extends { findMany: (...args: any[]) => Promise<infer T extends Array<any>> } ? T[number] : never) & { distance: number } | null> {
  const where: any = {
    isActive: options.includeInactive ? undefined : true,
  };

  if (options.city) {
    where.city = options.city;
  }

  const warehouses = await prisma.warehouse.findMany({ where });

  if (warehouses.length === 0) {
    return null;
  }

  // Calculate distances and find nearest
  const warehousesWithDistance = warehouses.map(warehouse => ({
    ...warehouse,
    distance: calculateDistance(
      { lat: Number(warehouse.latitude), lng: Number(warehouse.longitude) },
      deliveryLocation
    ),
  }));

  // Sort by distance
  warehousesWithDistance.sort((a, b) => a.distance - b.distance);

  return warehousesWithDistance[0];
}

/**
 * Get primary warehouse (default fallback)
 */
export async function getPrimaryWarehouse() {
  return await prisma.warehouse.findFirst({
    where: { isPrimary: true, isActive: true },
  });
}

/**
 * Select optimal warehouse for an order
 * Considers distance, capacity, and operating hours
 */
export async function selectWarehouseForOrder(
  deliveryLocation: Location,
  options: {
    preferredCity?: string;
    requiredCapacity?: number;
  } = {}
) {
  // Try to find in preferred city first
  if (options.preferredCity) {
    const cityWarehouse = await findNearestWarehouse(deliveryLocation, {
      city: options.preferredCity,
    });
    
    if (cityWarehouse) {
      // Check capacity if required
      if (options.requiredCapacity && cityWarehouse.capacity) {
        if (cityWarehouse.capacity >= options.requiredCapacity) {
          return cityWarehouse;
        }
      } else {
        return cityWarehouse;
      }
    }
  }

  // Fall back to nearest warehouse regardless of city
  const nearestWarehouse = await findNearestWarehouse(deliveryLocation);
  
  if (nearestWarehouse) {
    // Check capacity if required
    if (options.requiredCapacity && nearestWarehouse.capacity) {
      if (nearestWarehouse.capacity >= options.requiredCapacity) {
        return nearestWarehouse;
      }
      // If capacity is insufficient, try primary warehouse
      return await getPrimaryWarehouse();
    }
    return nearestWarehouse;
  }

  // Final fallback to primary warehouse
  return await getPrimaryWarehouse();
}

/**
 * Estimate delivery time from warehouse to destination
 * @param distance Distance in km
 * @param trafficFactor Multiplier for traffic conditions (1.0 = no traffic, 2.0 = heavy traffic)
 * @returns Estimated time in minutes
 */
export function estimateDeliveryTime(
  distance: number,
  trafficFactor: number = 1.0
): number {
  // Average speed: 30 km/h in city traffic
  const baseSpeed = 30;
  const adjustedSpeed = baseSpeed / trafficFactor;
  const timeHours = distance / adjustedSpeed;
  
  // Add 10 minutes for handling/preparation
  return Math.ceil(timeHours * 60) + 10;
}

/**
 * Get traffic level for a route
 * 
 * TODO: Integrate with real traffic API
 * Environment variables needed:
 * - GOOGLE_MAPS_API_KEY for Google Maps Directions API
 *   Endpoint: https://maps.googleapis.com/maps/api/directions/json
 * - MAPBOX_ACCESS_TOKEN for Mapbox Directions API
 *   Endpoint: https://api.mapbox.com/directions/v5/mapbox/driving-traffic
 * - HERE_API_KEY for HERE Traffic API
 *   Endpoint: https://route.ls.hereapi.com/routing/7.2/calculateroute.json
 * 
 * For now, returns mock data based on time of day
 */
export async function getTrafficLevel(
  origin: Location,
  destination: Location
): Promise<{
  level: 'low' | 'moderate' | 'heavy' | 'severe';
  delayMinutes: number;
  trafficFactor: number;
}> {
  // TODO: Integrate with real traffic API
  // For now, return mock data based on time of day
  
  const hour = new Date().getHours();
  
  // Peak hours: 7-9 AM, 5-7 PM
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return {
      level: 'heavy',
      delayMinutes: 20,
      trafficFactor: 1.8,
    };
  }
  
  // Moderate hours: 10 AM - 4 PM
  if (hour >= 10 && hour <= 16) {
    return {
      level: 'moderate',
      delayMinutes: 10,
      trafficFactor: 1.3,
    };
  }
  
  // Light traffic
  return {
    level: 'low',
    delayMinutes: 0,
    trafficFactor: 1.0,
  };
}

/**
 * Calculate route information including traffic
 */
export async function calculateRouteInfo(
  warehouseId: string,
  destinationLocation: Location
): Promise<{
  warehouse: any;
  distance: number;
  estimatedTime: number;
  traffic: {
    level: 'low' | 'moderate' | 'heavy' | 'severe';
    delayMinutes: number;
    trafficFactor: number;
  };
}> {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  const warehouseLocation = {
    lat: Number(warehouse.latitude),
    lng: Number(warehouse.longitude),
  };

  const distance = calculateDistance(warehouseLocation, destinationLocation);
  const traffic = await getTrafficLevel(warehouseLocation, destinationLocation);
  const estimatedTime = estimateDeliveryTime(distance, traffic.trafficFactor);

  return {
    warehouse,
    distance,
    estimatedTime,
    traffic,
  };
}
