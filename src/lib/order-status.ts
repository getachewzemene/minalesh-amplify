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
 * The canonical order progression for the 7-stage delivery tracking.
 * Used to derive completed steps in the progress tracker UI.
 */
export const TRACKING_ORDER_PROGRESSION: OrderStatus[] = [
  'pending',
  'paid',
  'confirmed',
  'processing',
  'packed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

/**
 * Get all completed statuses for a given current status in the tracking progression.
 * This is used by the UI to determine which steps to mark as completed.
 */
export function getCompletedStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const progressionIndex = TRACKING_ORDER_PROGRESSION.indexOf(currentStatus);
  
  if (progressionIndex === -1) {
    // Handle legacy statuses
    if (currentStatus === 'fulfilled') {
      return ['pending', 'paid', 'confirmed', 'processing'];
    }
    if (currentStatus === 'shipped') {
      return ['pending', 'paid', 'confirmed', 'processing', 'packed', 'picked_up'];
    }
    return ['pending'];
  }
  
  // Return all statuses up to and including the current status
  return TRACKING_ORDER_PROGRESSION.slice(0, progressionIndex + 1);
}

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
