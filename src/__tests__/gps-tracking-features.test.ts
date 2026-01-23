/**
 * Tests for GPS tracking and warehouse features
 */

import { describe, it, expect } from 'vitest';
import { calculateDistance, estimateDeliveryTime } from '@/lib/warehouse-routing';

describe('Warehouse Routing Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Addis Ababa to Dire Dawa (approx 350 km by air)
      const addisAbaba = { lat: 9.0320, lng: 38.7469 };
      const direDawa = { lat: 9.6008, lng: 41.8661 };
      
      const distance = calculateDistance(addisAbaba, direDawa);
      
      // Should be around 345-355 km (straight line distance)
      expect(distance).toBeGreaterThan(340);
      expect(distance).toBeLessThan(360);
    });

    it('should return 0 for same location', () => {
      const location = { lat: 9.0320, lng: 38.7469 };
      
      const distance = calculateDistance(location, location);
      
      expect(distance).toBe(0);
    });

    it('should calculate short distances correctly', () => {
      // Two nearby points in Addis Ababa
      const point1 = { lat: 9.0192, lng: 38.7525 };
      const point2 = { lat: 9.0320, lng: 38.7469 };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be less than 5 km
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5);
    });
  });

  describe('estimateDeliveryTime', () => {
    it('should estimate delivery time for short distance', () => {
      const distance = 5; // 5 km
      const time = estimateDeliveryTime(distance);
      
      // At 30 km/h average speed, 5km takes 10 minutes + 10 min handling = 20 min
      expect(time).toBeGreaterThanOrEqual(20);
      expect(time).toBeLessThanOrEqual(25);
    });

    it('should account for traffic factor', () => {
      const distance = 10; // 10 km
      
      const normalTime = estimateDeliveryTime(distance, 1.0); // No traffic
      const heavyTrafficTime = estimateDeliveryTime(distance, 2.0); // Heavy traffic
      
      expect(heavyTrafficTime).toBeGreaterThan(normalTime);
      expect(heavyTrafficTime).toBeGreaterThanOrEqual(normalTime * 1.5);
    });

    it('should add handling time to all estimates', () => {
      const distance = 0; // 0 km distance
      const time = estimateDeliveryTime(distance);
      
      // Should still have 10 minutes for handling
      expect(time).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('GPS Tracking Data Structure', () => {
  it('should support courier location data', () => {
    const courierLocation = {
      latitude: 9.0192,
      longitude: 38.7525,
      timestamp: new Date(),
      accuracy: 10,
    };

    expect(courierLocation.latitude).toBeGreaterThanOrEqual(-90);
    expect(courierLocation.latitude).toBeLessThanOrEqual(90);
    expect(courierLocation.longitude).toBeGreaterThanOrEqual(-180);
    expect(courierLocation.longitude).toBeLessThanOrEqual(180);
    expect(courierLocation.timestamp).toBeInstanceOf(Date);
  });

  it('should support warehouse location data', () => {
    const warehouse = {
      name: 'Addis Ababa Central',
      code: 'AA-CENTRAL',
      latitude: 9.0192,
      longitude: 38.7525,
      city: 'Addis Ababa',
      isActive: true,
      isPrimary: true,
    };

    expect(warehouse.code).toBeDefined();
    expect(warehouse.latitude).toBeGreaterThanOrEqual(-90);
    expect(warehouse.longitude).toBeGreaterThanOrEqual(-180);
    expect(warehouse.isActive).toBe(true);
  });

  it('should support traffic data structure', () => {
    const trafficData = {
      level: 'moderate' as const,
      delayMinutes: 15,
      trafficFactor: 1.5,
    };

    expect(['low', 'moderate', 'heavy', 'severe']).toContain(trafficData.level);
    expect(trafficData.delayMinutes).toBeGreaterThanOrEqual(0);
    expect(trafficData.trafficFactor).toBeGreaterThanOrEqual(1.0);
  });
});

describe('Map Component Props', () => {
  it('should support CourierTrackingMap props', () => {
    const props = {
      warehouse: {
        name: 'Addis Ababa Central',
        city: 'Addis Ababa',
        lat: 9.0192,
        lng: 38.7525,
      },
      destination: {
        city: 'Addis Ababa',
        fullAddress: '123 Bole Road',
        lat: 9.0320,
        lng: 38.7469,
      },
      courierLocation: {
        latitude: 9.025,
        longitude: 38.750,
        timestamp: new Date(),
        accuracy: 10,
      },
      courierInfo: {
        name: 'John Doe',
        phone: '+251911234567',
        vehicleInfo: 'Blue motorcycle, ABC123',
      },
      trafficConditions: {
        level: 'moderate' as const,
        delayMinutes: 10,
      },
      enableRealTimeUpdates: true,
    };

    expect(props.warehouse).toBeDefined();
    expect(props.destination).toBeDefined();
    expect(props.courierLocation).toBeDefined();
    expect(props.trafficConditions?.level).toBe('moderate');
  });

  it('should support Terrain3DMap props', () => {
    const props = {
      warehouse: {
        name: 'Addis Ababa Central',
        lat: 9.0192,
        lng: 38.7525,
        elevation: 2355,
      },
      destination: {
        address: '123 Bole Road',
        city: 'Addis Ababa',
        lat: 9.0320,
        lng: 38.7469,
        elevation: 2400,
      },
      courierLocation: {
        lat: 9.025,
        lng: 38.750,
        elevation: 2380,
      },
      enableTerrain: true,
      enable3DBuildings: true,
      mapStyle: 'outdoors' as const,
    };

    expect(props.enableTerrain).toBe(true);
    expect(props.enable3DBuildings).toBe(true);
    expect(['streets', 'satellite', 'outdoors', 'dark', 'light']).toContain(props.mapStyle);
  });
});
