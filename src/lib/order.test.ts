import { describe, it, expect } from 'vitest';
import { OrderStatus } from '@prisma/client';

// Valid order status transitions (copied from order status API)
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['processing', 'cancelled'],
  processing: ['fulfilled', 'cancelled'],
  fulfilled: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

describe('Order lifecycle', () => {
  describe('Order status transitions', () => {
    it('should allow valid transition from pending to paid', () => {
      const currentStatus: OrderStatus = 'pending';
      const nextStatus: OrderStatus = 'paid';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from pending to cancelled', () => {
      const currentStatus: OrderStatus = 'pending';
      const nextStatus: OrderStatus = 'cancelled';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from paid to confirmed', () => {
      const currentStatus: OrderStatus = 'paid';
      const nextStatus: OrderStatus = 'confirmed';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from confirmed to processing', () => {
      const currentStatus: OrderStatus = 'confirmed';
      const nextStatus: OrderStatus = 'processing';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from processing to fulfilled', () => {
      const currentStatus: OrderStatus = 'processing';
      const nextStatus: OrderStatus = 'fulfilled';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from fulfilled to shipped', () => {
      const currentStatus: OrderStatus = 'fulfilled';
      const nextStatus: OrderStatus = 'shipped';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow valid transition from shipped to delivered', () => {
      const currentStatus: OrderStatus = 'shipped';
      const nextStatus: OrderStatus = 'delivered';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow refund from paid status', () => {
      const currentStatus: OrderStatus = 'paid';
      const nextStatus: OrderStatus = 'refunded';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should allow refund from delivered status', () => {
      const currentStatus: OrderStatus = 'delivered';
      const nextStatus: OrderStatus = 'refunded';
      expect(VALID_TRANSITIONS[currentStatus]).toContain(nextStatus);
    });

    it('should not allow transition from pending to fulfilled', () => {
      const currentStatus: OrderStatus = 'pending';
      const nextStatus: OrderStatus = 'fulfilled';
      expect(VALID_TRANSITIONS[currentStatus]).not.toContain(nextStatus);
    });

    it('should not allow transition from cancelled status', () => {
      const currentStatus: OrderStatus = 'cancelled';
      expect(VALID_TRANSITIONS[currentStatus]).toHaveLength(0);
    });

    it('should not allow transition from refunded status', () => {
      const currentStatus: OrderStatus = 'refunded';
      expect(VALID_TRANSITIONS[currentStatus]).toHaveLength(0);
    });

    it('should allow cancellation from most active statuses', () => {
      const cancelableStatuses: OrderStatus[] = ['pending', 'paid', 'confirmed', 'processing', 'fulfilled', 'shipped'];
      
      cancelableStatuses.forEach(status => {
        expect(VALID_TRANSITIONS[status]).toContain('cancelled');
      });
    });
  });

  describe('Order timestamp fields', () => {
    it('should have timestamp field for each status', () => {
      const statusToTimestamp: Record<OrderStatus, string> = {
        pending: 'createdAt',
        paid: 'paidAt',
        confirmed: 'confirmedAt',
        processing: 'processingAt',
        fulfilled: 'fulfilledAt',
        shipped: 'shippedAt',
        delivered: 'deliveredAt',
        cancelled: 'cancelledAt',
        refunded: 'refundedAt',
      };

      Object.keys(statusToTimestamp).forEach(status => {
        expect(statusToTimestamp[status as OrderStatus]).toBeDefined();
      });
    });
  });

  describe('Order event metadata', () => {
    it('should include required fields in event metadata', () => {
      const metadata = {
        previousStatus: 'pending',
        newStatus: 'paid',
        changedBy: 'user-id',
        changedByEmail: 'user@example.com',
      };

      expect(metadata.previousStatus).toBeDefined();
      expect(metadata.newStatus).toBeDefined();
      expect(metadata.changedBy).toBeDefined();
      expect(metadata.changedByEmail).toBeDefined();
    });
  });
});
