/**
 * Payment Capture System
 * 
 * Handles full and partial payment captures.
 * Supports Stripe and Ethiopian payment providers.
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';

// Initialize Stripe if configured
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

export interface CaptureRequest {
  orderId: string;
  amount?: number; // If not provided, captures full authorized amount
  finalCapture?: boolean; // If true, no more captures can be made
}

export interface CaptureResult {
  success: boolean;
  captureId?: string;
  capturedAmount?: number;
  error?: string;
}

/**
 * Capture payment for an order
 * Supports full and partial captures
 */
export async function capturePayment(
  request: CaptureRequest
): Promise<CaptureResult> {
  const { orderId, amount, finalCapture = true } = request;

  try {
    // Fetch order with payment details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.paymentStatus === 'completed') {
      return { 
        success: false, 
        error: 'Payment already captured' 
      };
    }

    if (order.paymentStatus === 'failed') {
      return { 
        success: false, 
        error: 'Payment failed, cannot capture' 
      };
    }

    // Check for payment intent only for payment methods that require it
    const provider = order.paymentMethod?.toLowerCase() || 'manual';
    const requiresPaymentIntent = provider === 'stripe';
    
    if (requiresPaymentIntent && !order.stripeSessionId) {
      return { 
        success: false, 
        error: 'No payment intent found for this order' 
      };
    }

    // Determine capture amount
    const captureAmount = amount !== undefined ? amount : Number(order.totalAmount);
    const orderTotal = Number(order.totalAmount);

    if (captureAmount <= 0) {
      return {
        success: false,
        error: 'Capture amount must be greater than zero',
      };
    }

    if (captureAmount > orderTotal) {
      return {
        success: false,
        error: `Capture amount (${captureAmount}) exceeds order total (${orderTotal})`,
      };
    }

    // Process capture based on payment provider (provider already defined above)
    let success = false;
    let captureId: string | null = null;

    switch (provider) {
      case 'stripe':
        if (stripe) {
          try {
            // For Stripe, we need to capture the payment intent
            const paymentIntent = await stripe.paymentIntents.capture(
              order.stripeSessionId,
              {
                amount_to_capture: Math.round(captureAmount * 100), // Convert to cents
                metadata: {
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  finalCapture: finalCapture.toString(),
                },
              }
            );
            
            success = paymentIntent.status === 'succeeded';
            captureId = paymentIntent.id;
          } catch (error: unknown) {
            console.error('Stripe capture error:', error);
            if (error instanceof Error) {
              return { 
                success: false, 
                error: error.message || 'Failed to capture Stripe payment' 
              };
            }
            return { success: false, error: 'Failed to capture Stripe payment' };
          }
        } else {
          return { 
            success: false, 
            error: 'Stripe not configured' 
          };
        }
        break;

      case 'telebirr':
        // TeleBirr capture - for Ethiopian mobile payments
        success = await captureTeleBirrPayment(order, captureAmount);
        captureId = `TBR-CAPTURE-${Date.now()}`;
        break;

      case 'cbe':
        // CBE capture - for Ethiopian bank payments
        success = await captureCBEPayment(order, captureAmount);
        captureId = `CBE-CAPTURE-${Date.now()}`;
        break;

      case 'awash':
        // Awash Bank capture - for Ethiopian bank payments
        success = await captureAwashPayment(order, captureAmount);
        captureId = `AWB-CAPTURE-${Date.now()}`;
        break;

      case 'cod':
      case 'manual':
        // Manual payments are captured immediately on confirmation
        success = true;
        captureId = 'MANUAL-CAPTURE';
        break;

      default:
        success = true;
        captureId = 'MANUAL-CAPTURE';
        break;
    }

    if (success) {
      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'completed',
          status: order.status === 'pending' ? 'paid' : order.status,
          paidAt: new Date(),
          notes: `Payment captured: ${captureAmount} ETB${
            order.notes ? ` | ${order.notes}` : ''
          }`,
        },
      });

      // Create order event
      await prisma.orderEvent.create({
        data: {
          orderId,
          eventType: 'payment_capture',
          status: 'paid',
          description: `Payment captured: ${captureAmount} ETB`,
          metadata: {
            captureId,
            capturedAmount: captureAmount,
            finalCapture,
            provider: order.paymentMethod,
          },
        },
      });

      return {
        success: true,
        captureId: captureId || undefined,
        capturedAmount: captureAmount,
      };
    }

    return { success: false, error: 'Payment capture failed' };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to capture payment' 
    };
  }
}

/**
 * Get capture status for an order
 */
export async function getCaptureStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      paymentStatus: true,
      paymentMethod: true,
      paidAt: true,
      stripeSessionId: true,
    },
  });

  if (!order) {
    return null;
  }

  // Check if payment is capturable
  const isCapturable = 
    order.paymentStatus === 'pending' || 
    order.paymentStatus === 'processing';

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalAmount: Number(order.totalAmount),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    isCapturable,
    paidAt: order.paidAt,
  };
}

/**
 * Capture TeleBirr payment
 * Ethiopian mobile payment capture integration
 */
async function captureTeleBirrPayment(
  order: { id: string; paymentReference?: string | null; orderNumber: string },
  amount: number
): Promise<boolean> {
  // Placeholder for TeleBirr API integration
  // In production, implement actual API call:
  //
  // const response = await fetch('https://api.telebirr.et/v1/captures', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     payment_reference: order.paymentReference,
  //     amount: amount,
  //     currency: 'ETB',
  //   }),
  // });
  // return response.ok;

  console.log('TeleBirr capture:', {
    amount,
    orderId: order.id,
    orderNumber: order.orderNumber,
    reference: order.paymentReference,
  });

  // Return true for development/testing
  return true;
}

/**
 * Capture CBE (Commercial Bank of Ethiopia) payment
 */
async function captureCBEPayment(
  order: { id: string; paymentReference?: string | null; orderNumber: string },
  amount: number
): Promise<boolean> {
  // Placeholder for CBE Bank API integration
  // In production, implement actual API call:
  //
  // const response = await fetch('https://api.cbe.et/payments/capture', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.CBE_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     transaction_id: order.paymentReference,
  //     amount: amount,
  //     currency: 'ETB',
  //   }),
  // });
  // return response.ok;

  console.log('CBE capture:', {
    amount,
    orderId: order.id,
    orderNumber: order.orderNumber,
    reference: order.paymentReference,
  });

  // Return true for development/testing
  return true;
}

/**
 * Capture Awash Bank payment
 */
async function captureAwashPayment(
  order: { id: string; paymentReference?: string | null; orderNumber: string },
  amount: number
): Promise<boolean> {
  // Placeholder for Awash Bank API integration
  // In production, implement actual API call:
  //
  // const response = await fetch('https://api.awashbank.com/captures', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.AWASH_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     payment_reference: order.paymentReference,
  //     capture_amount: amount,
  //     currency: 'ETB',
  //   }),
  // });
  // return response.ok;

  console.log('Awash Bank capture:', {
    amount,
    orderId: order.id,
    orderNumber: order.orderNumber,
    reference: order.paymentReference,
  });

  // Return true for development/testing
  return true;
}
