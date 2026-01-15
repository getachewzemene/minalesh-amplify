/**
 * Order Status Validation and State Machine
 * 
 * Defines valid state transitions for orders to prevent invalid status changes.
 * 
 * Order Stages (per enhanced tracking requirements):
 * 1. Order placed (pending)
 * 2. Vendor confirmed (confirmed)
 * 3. Packed (packed)
 * 4. Picked up by courier (picked_up)
 * 5. In transit (in_transit)
 * 6. Out for delivery (out_for_delivery)
 * 7. Delivered (delivered)
 */

import { OrderStatus } from '@prisma/client';

// Define valid state transitions
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['processing', 'packed', 'cancelled', 'refunded'],
  processing: ['packed', 'fulfilled', 'cancelled', 'refunded'],
  packed: ['picked_up', 'shipped', 'cancelled', 'refunded'],
  picked_up: ['in_transit', 'shipped', 'cancelled', 'refunded'],
  in_transit: ['out_for_delivery', 'shipped', 'delivered', 'refunded'],
  out_for_delivery: ['delivered', 'refunded'],
  fulfilled: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  // Allow staying in the same status
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get all valid next statuses for a given status
 */
export function getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Validate status transition and return error message if invalid
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): { valid: boolean; error?: string } {
  if (isValidStatusTransition(currentStatus, newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${getValidNextStatuses(currentStatus).join(', ') || 'none (terminal state)'}`,
  };
}

/**
 * Check if a status is a terminal state (no further transitions allowed)
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[status].length === 0;
}
