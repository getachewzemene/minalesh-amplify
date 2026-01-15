/**
 * SMS Service for Order Tracking Notifications
 * 
 * Sends SMS notifications at each order stage:
 * 1. Order placed
 * 2. Vendor confirmed
 * 3. Packed
 * 4. Picked up by courier
 * 5. In transit
 * 6. Out for delivery
 * 7. Delivered
 */

import { logError, logEvent } from './logger';
import prisma from './prisma';

export interface SMSMessage {
  to: string;
  message: string;
  orderId?: string;
  stage?: string;
}

export interface SMSProvider {
  send(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * SMS Provider Configuration
 * Supports multiple Ethiopian SMS gateways
 */
const SMS_PROVIDERS = {
  AFRICAS_TALKING: 'africas_talking',
  TWILIO: 'twilio',
  MOCK: 'mock', // For development/testing
} as const;

/**
 * Mock SMS provider for development/testing
 */
class MockSMSProvider implements SMSProvider {
  async send(message: SMSMessage): Promise<{ success: boolean; messageId?: string }> {
    console.log('📱 SMS (Mock):', {
      to: message.to,
      message: message.message,
      stage: message.stage,
    });
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

/**
 * Africa's Talking SMS Provider (common in Ethiopia)
 */
class AfricasTalkingSMSProvider implements SMSProvider {
  private apiKey: string;
  private username: string;
  private shortCode: string;

  constructor() {
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY || '';
    this.username = process.env.AFRICAS_TALKING_USERNAME || '';
    this.shortCode = process.env.AFRICAS_TALKING_SHORT_CODE || '';
  }

  async send(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey || !this.username) {
      logError(new Error('Africa\'s Talking credentials not configured'), {
        operation: 'sms_send',
      });
      return { success: false, error: 'SMS provider not configured' };
    }

    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
        },
        body: new URLSearchParams({
          username: this.username,
          to: message.to,
          message: message.message,
          ...(this.shortCode && { from: this.shortCode }),
        }),
      });

      const data = await response.json();
      
      if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
        return { 
          success: true, 
          messageId: data.SMSMessageData.Recipients[0].messageId 
        };
      }
      
      return { 
        success: false, 
        error: data.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error' 
      };
    } catch (error) {
      logError(error, { operation: 'africas_talking_sms' });
      return { success: false, error: 'Failed to send SMS' };
    }
  }
}

/**
 * Get the configured SMS provider
 */
function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || SMS_PROVIDERS.MOCK;

  switch (provider) {
    case SMS_PROVIDERS.AFRICAS_TALKING:
      return new AfricasTalkingSMSProvider();
    case SMS_PROVIDERS.MOCK:
    default:
      return new MockSMSProvider();
  }
}

/**
 * Send SMS notification
 */
export async function sendSMS(message: SMSMessage): Promise<boolean> {
  try {
    const provider = getSMSProvider();
    const result = await provider.send(message);

    if (result.success) {
      logEvent('sms_sent', {
        to: message.to,
        stage: message.stage,
        orderId: message.orderId,
        messageId: result.messageId,
      });
    } else {
      logError(new Error(result.error || 'SMS send failed'), {
        operation: 'sendSMS',
        to: message.to,
        stage: message.stage,
      });
    }

    return result.success;
  } catch (error) {
    logError(error, { operation: 'sendSMS' });
    return false;
  }
}

/**
 * Order stage to human-readable message mapping
 */
const ORDER_STAGE_MESSAGES: Record<string, (orderNumber: string, extras?: Record<string, string>) => string> = {
  pending: (orderNumber) => 
    `Minalesh: Your order ${orderNumber} has been placed successfully. We'll notify you when it's confirmed.`,
  
  confirmed: (orderNumber) => 
    `Minalesh: Great news! Your order ${orderNumber} has been confirmed by the vendor and is being prepared.`,
  
  packed: (orderNumber) => 
    `Minalesh: Your order ${orderNumber} has been packed and is ready for pickup by our delivery partner.`,
  
  picked_up: (orderNumber, extras) => 
    `Minalesh: Your order ${orderNumber} has been picked up by ${extras?.courierName || 'our courier'}. Contact: ${extras?.courierPhone || 'N/A'}`,
  
  in_transit: (orderNumber, extras) => 
    `Minalesh: Your order ${orderNumber} is on the way! ${extras?.estimatedTime ? `Estimated arrival: ${extras.estimatedTime}` : ''}`,
  
  out_for_delivery: (orderNumber, extras) => 
    `Minalesh: Your order ${orderNumber} is out for delivery! ${extras?.courierName ? `Courier: ${extras.courierName}` : ''} ${extras?.courierPhone ? `Contact: ${extras.courierPhone}` : ''}`,
  
  delivered: (orderNumber) => 
    `Minalesh: Your order ${orderNumber} has been delivered! Thank you for shopping with us. Rate your experience in the app.`,
};

/**
 * Send order tracking notification SMS
 */
export async function sendOrderTrackingSMS(
  orderNumber: string,
  phone: string,
  stage: string,
  extras?: Record<string, string>
): Promise<boolean> {
  const messageGenerator = ORDER_STAGE_MESSAGES[stage];
  
  if (!messageGenerator) {
    logEvent('sms_stage_not_configured', { stage, orderNumber });
    return false;
  }

  const message = messageGenerator(orderNumber, extras);
  
  return sendSMS({
    to: phone,
    message,
    orderId: orderNumber,
    stage,
  });
}

/**
 * Record SMS notification in delivery tracking
 */
export async function recordSMSNotification(
  orderId: string,
  stage: string,
  phone: string,
  success: boolean
): Promise<void> {
  try {
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { orderId },
      select: { smsNotificationsSent: true },
    });

    const notifications = (tracking?.smsNotificationsSent as any[] || []);
    notifications.push({
      stage,
      phone,
      success,
      sentAt: new Date().toISOString(),
    });

    await prisma.deliveryTracking.upsert({
      where: { orderId },
      update: {
        smsNotificationsSent: notifications,
      },
      create: {
        orderId,
        smsNotificationsSent: notifications,
      },
    });
  } catch (error) {
    logError(error, { operation: 'recordSMSNotification', orderId });
  }
}

/**
 * Format Ethiopian phone number to international format
 */
export function formatEthiopianPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle various formats
  if (cleaned.startsWith('251')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+251${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    return `+251${cleaned}`;
  }
  
  // Return as-is if already in correct format
  return phone.startsWith('+') ? phone : `+${phone}`;
}
