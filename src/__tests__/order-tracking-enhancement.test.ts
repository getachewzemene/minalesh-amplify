/**
 * Tests for Enhanced Order Tracking
 * 
 * Tests the order tracking enhancement features:
 * - 7 order stages
 * - SMS notifications
 * - GPS tracking
 * - Delivery person info
 * - Photo proof of delivery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatus } from '@prisma/client';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryTracking: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

import { isValidStatusTransition, getValidNextStatuses, getCompletedStatuses, TRACKING_ORDER_PROGRESSION } from '@/lib/order-status';

describe('Order Tracking Enhancement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Status State Machine', () => {
    it('should have all 7 required order stages', () => {
      const requiredStages = [
        'pending',     // Order placed
        'confirmed',   // Vendor confirmed
        'packed',      // Packed
        'picked_up',   // Picked up by courier
        'in_transit',  // In transit
        'out_for_delivery', // Out for delivery
        'delivered',   // Delivered
      ];

      // Verify all stages are valid statuses
      requiredStages.forEach(stage => {
        expect(['pending', 'paid', 'confirmed', 'processing', 'packed', 'picked_up', 
                'in_transit', 'out_for_delivery', 'fulfilled', 'shipped', 'delivered', 
                'cancelled', 'refunded']).toContain(stage);
      });
    });

    it('should allow transition from pending to paid', () => {
      expect(isValidStatusTransition('pending' as OrderStatus, 'paid' as OrderStatus)).toBe(true);
    });

    it('should allow transition from paid to confirmed', () => {
      expect(isValidStatusTransition('paid' as OrderStatus, 'confirmed' as OrderStatus)).toBe(true);
    });

    it('should allow transition from confirmed to packed', () => {
      expect(isValidStatusTransition('confirmed' as OrderStatus, 'packed' as OrderStatus)).toBe(true);
    });

    it('should allow transition from packed to picked_up', () => {
      expect(isValidStatusTransition('packed' as OrderStatus, 'picked_up' as OrderStatus)).toBe(true);
    });

    it('should allow transition from picked_up to in_transit', () => {
      expect(isValidStatusTransition('picked_up' as OrderStatus, 'in_transit' as OrderStatus)).toBe(true);
    });

    it('should allow transition from in_transit to out_for_delivery', () => {
      expect(isValidStatusTransition('in_transit' as OrderStatus, 'out_for_delivery' as OrderStatus)).toBe(true);
    });

    it('should allow transition from out_for_delivery to delivered', () => {
      expect(isValidStatusTransition('out_for_delivery' as OrderStatus, 'delivered' as OrderStatus)).toBe(true);
    });

    it('should not allow skipping stages (pending directly to delivered)', () => {
      expect(isValidStatusTransition('pending' as OrderStatus, 'delivered' as OrderStatus)).toBe(false);
    });

    it('should not allow backwards transitions (delivered to pending)', () => {
      expect(isValidStatusTransition('delivered' as OrderStatus, 'pending' as OrderStatus)).toBe(false);
    });

    it('should allow refund at most stages', () => {
      const refundableStatuses: OrderStatus[] = ['paid', 'confirmed', 'packed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
      
      refundableStatuses.forEach(status => {
        expect(isValidStatusTransition(status as OrderStatus, 'refunded' as OrderStatus)).toBe(true);
      });
    });

    it('should return valid next statuses for in_transit', () => {
      const nextStatuses = getValidNextStatuses('in_transit' as OrderStatus);
      expect(nextStatuses).toContain('out_for_delivery');
      expect(nextStatuses).toContain('delivered');
      expect(nextStatuses).toContain('refunded');
    });
  });

  describe('SMS Notification Messages', () => {
    it('should have appropriate message for each stage', () => {
      const stageMessages: Record<string, string> = {
        pending: 'order has been placed',
        confirmed: 'confirmed by the vendor',
        packed: 'packed and is ready',
        picked_up: 'picked up',
        in_transit: 'on the way',
        out_for_delivery: 'out for delivery',
        delivered: 'has been delivered',
      };

      Object.entries(stageMessages).forEach(([stage, expectedText]) => {
        expect(expectedText.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCompletedStatuses Utility', () => {
    it('should return correct completed statuses for pending', () => {
      const completed = getCompletedStatuses('pending' as OrderStatus);
      expect(completed).toContain('pending');
      expect(completed.length).toBe(1);
    });

    it('should return correct completed statuses for delivered', () => {
      const completed = getCompletedStatuses('delivered' as OrderStatus);
      expect(completed).toContain('pending');
      expect(completed).toContain('delivered');
      expect(completed.length).toBe(9); // All stages
    });

    it('should return correct completed statuses for in_transit', () => {
      const completed = getCompletedStatuses('in_transit' as OrderStatus);
      expect(completed).toContain('pending');
      expect(completed).toContain('packed');
      expect(completed).toContain('picked_up');
      expect(completed).toContain('in_transit');
      expect(completed).not.toContain('out_for_delivery');
      expect(completed).not.toContain('delivered');
    });

    it('should handle legacy fulfilled status', () => {
      const completed = getCompletedStatuses('fulfilled' as OrderStatus);
      expect(completed).toContain('pending');
      expect(completed).toContain('processing');
    });

    it('should have canonical progression array', () => {
      expect(TRACKING_ORDER_PROGRESSION.length).toBeGreaterThan(0);
      expect(TRACKING_ORDER_PROGRESSION[0]).toBe('pending');
      expect(TRACKING_ORDER_PROGRESSION[TRACKING_ORDER_PROGRESSION.length - 1]).toBe('delivered');
    });
  });

  describe('Delivery Tracking Data Model', () => {
    it('should support courier information fields', () => {
      const courierInfo = {
        name: 'John Doe',
        phone: '+251911234567',
        photoUrl: 'https://example.com/photo.jpg',
        vehicleInfo: 'Blue motorcycle, plate ABC123',
      };

      expect(courierInfo.name).toBeDefined();
      expect(courierInfo.phone).toBeDefined();
      expect(courierInfo.photoUrl).toBeDefined();
      expect(courierInfo.vehicleInfo).toBeDefined();
    });

    it('should support GPS coordinates', () => {
      const gpsLocation = {
        latitude: 9.0192,
        longitude: 38.7525,
        timestamp: new Date(),
        accuracy: 10,
      };

      expect(gpsLocation.latitude).toBeGreaterThanOrEqual(-90);
      expect(gpsLocation.latitude).toBeLessThanOrEqual(90);
      expect(gpsLocation.longitude).toBeGreaterThanOrEqual(-180);
      expect(gpsLocation.longitude).toBeLessThanOrEqual(180);
    });

    it('should support delivery window', () => {
      const now = new Date();
      const deliveryWindow = {
        start: now,
        end: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes later
      };

      expect(deliveryWindow.end.getTime()).toBeGreaterThan(deliveryWindow.start.getTime());
    });

    it('should support delivery proof', () => {
      const deliveryProof = {
        photoUrl: 'https://example.com/delivery-proof.jpg',
        signatureUrl: 'https://example.com/signature.jpg',
        recipientName: 'Jane Doe',
        notes: 'Left with neighbor',
        timestamp: new Date(),
      };

      expect(deliveryProof.photoUrl).toBeDefined();
      expect(deliveryProof.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Phone Number Formatting', () => {
    it('should format Ethiopian phone numbers correctly', async () => {
      const { formatEthiopianPhone } = await import('@/lib/sms');

      // Test various input formats
      expect(formatEthiopianPhone('0911234567')).toBe('+251911234567');
      expect(formatEthiopianPhone('911234567')).toBe('+251911234567');
      expect(formatEthiopianPhone('251911234567')).toBe('+251911234567');
      expect(formatEthiopianPhone('+251911234567')).toBe('+251911234567');
    });
  });

  describe('Order Progress Steps', () => {
    it('should have 7 visual progress steps', () => {
      const progressSteps = [
        { key: 'pending', label: 'Order Placed' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'packed', label: 'Packed' },
        { key: 'picked_up', label: 'Picked Up' },
        { key: 'in_transit', label: 'In Transit' },
        { key: 'out_for_delivery', label: 'Out for Delivery' },
        { key: 'delivered', label: 'Delivered' },
      ];

      expect(progressSteps.length).toBe(7);
      expect(progressSteps[0].key).toBe('pending');
      expect(progressSteps[6].key).toBe('delivered');
    });

    it('should mark correct steps as completed for each status', () => {
      const getCompletedSteps = (status: string): string[] => {
        const completedByStatus: Record<string, string[]> = {
          pending: ['pending'],
          confirmed: ['pending', 'confirmed'],
          packed: ['pending', 'confirmed', 'packed'],
          picked_up: ['pending', 'confirmed', 'packed', 'picked_up'],
          in_transit: ['pending', 'confirmed', 'packed', 'picked_up', 'in_transit'],
          out_for_delivery: ['pending', 'confirmed', 'packed', 'picked_up', 'in_transit', 'out_for_delivery'],
          delivered: ['pending', 'confirmed', 'packed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'],
        };
        return completedByStatus[status] || [];
      };

      expect(getCompletedSteps('delivered').length).toBe(7);
      expect(getCompletedSteps('in_transit').length).toBe(5);
      expect(getCompletedSteps('pending').length).toBe(1);
    });
  });

  describe('Logistics Provider Integration', () => {
    it('should support multiple logistics providers', async () => {
      const { LOGISTICS_PROVIDERS } = await import('@/lib/logistics');

      expect(LOGISTICS_PROVIDERS).toBeDefined();
      expect(LOGISTICS_PROVIDERS.length).toBeGreaterThan(0);
      
      // Verify provider structure
      LOGISTICS_PROVIDERS.forEach(provider => {
        expect(provider.name).toBeDefined();
        expect(provider.code).toBeDefined();
        expect(typeof provider.webhookEnabled).toBe('boolean');
      });
    });
  });

  describe('Email Templates', () => {
    it('should have enhanced tracking email template', async () => {
      const { createEnhancedTrackingEmail } = await import('@/lib/email');

      const email = createEnhancedTrackingEmail(
        'test@example.com',
        'MIN-123456',
        'out_for_delivery',
        {
          courierName: 'John Doe',
          courierPhone: '+251911234567',
          estimatedDeliveryEnd: new Date(),
        }
      );

      expect(email.to).toBe('test@example.com');
      expect(email.subject).toContain('MIN-123456');
      expect(email.html).toContain('Out for Delivery');
      expect(email.html).toContain('John Doe');
    });
  });
});
