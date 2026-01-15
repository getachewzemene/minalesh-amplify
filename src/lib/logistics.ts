/**
 * Logistics Service for Order Tracking Enhancement
 * 
 * Handles integration with logistics providers for:
 * - Real-time GPS tracking (where available)
 * - Delivery person contact info
 * - Estimated delivery time windows
 * - Photo proof of delivery
 */

import prisma from './prisma';
import { logError, logEvent } from './logger';
import { sendOrderTrackingSMS, recordSMSNotification, formatEthiopianPhone } from './sms';

export interface LogisticsProvider {
  name: string;
  code: string;
  trackingUrlTemplate?: string;
  webhookEnabled: boolean;
}

export interface CourierInfo {
  name: string;
  phone: string;
  photoUrl?: string;
  vehicleInfo?: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface DeliveryWindow {
  start: Date;
  end: Date;
}

export interface DeliveryProof {
  photoUrl: string;
  signatureUrl?: string;
  recipientName?: string;
  notes?: string;
  timestamp: Date;
}

export interface TrackingUpdate {
  orderId: string;
  status: string;
  location?: GPSLocation;
  courierInfo?: CourierInfo;
  deliveryWindow?: DeliveryWindow;
  deliveryProof?: DeliveryProof;
  notes?: string;
}

/**
 * Supported logistics providers in Ethiopia
 */
export const LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  {
    name: 'Minalesh Express',
    code: 'minalesh',
    webhookEnabled: true,
  },
  {
    name: 'Ride (Ethiopia)',
    code: 'ride_et',
    webhookEnabled: false,
  },
  {
    name: 'ZayRide Delivery',
    code: 'zayride',
    webhookEnabled: false,
  },
  {
    name: 'Internal Delivery',
    code: 'internal',
    webhookEnabled: true,
  },
];

/**
 * Get logistics provider by code
 */
export function getLogisticsProvider(code: string): LogisticsProvider | undefined {
  return LOGISTICS_PROVIDERS.find(p => p.code === code);
}

/**
 * Create or update delivery tracking for an order
 */
export async function createDeliveryTracking(
  orderId: string,
  logisticsProvider?: string,
  providerTrackingId?: string
): Promise<void> {
  try {
    await prisma.deliveryTracking.upsert({
      where: { orderId },
      update: {
        logisticsProvider,
        providerTrackingId,
        providerWebhookEnabled: logisticsProvider 
          ? getLogisticsProvider(logisticsProvider)?.webhookEnabled ?? false 
          : false,
      },
      create: {
        orderId,
        logisticsProvider,
        providerTrackingId,
        providerWebhookEnabled: logisticsProvider 
          ? getLogisticsProvider(logisticsProvider)?.webhookEnabled ?? false 
          : false,
      },
    });

    logEvent('delivery_tracking_created', {
      orderId,
      logisticsProvider,
      providerTrackingId,
    });
  } catch (error) {
    logError(error, { operation: 'createDeliveryTracking', orderId });
    throw error;
  }
}

/**
 * Update courier information
 */
export async function updateCourierInfo(
  orderId: string,
  courierInfo: CourierInfo
): Promise<void> {
  try {
    await prisma.deliveryTracking.upsert({
      where: { orderId },
      update: {
        courierName: courierInfo.name,
        courierPhone: courierInfo.phone,
        courierPhotoUrl: courierInfo.photoUrl,
        courierVehicleInfo: courierInfo.vehicleInfo,
      },
      create: {
        orderId,
        courierName: courierInfo.name,
        courierPhone: courierInfo.phone,
        courierPhotoUrl: courierInfo.photoUrl,
        courierVehicleInfo: courierInfo.vehicleInfo,
      },
    });

    logEvent('courier_info_updated', {
      orderId,
      courierName: courierInfo.name,
    });
  } catch (error) {
    logError(error, { operation: 'updateCourierInfo', orderId });
    throw error;
  }
}

/**
 * Update GPS location
 */
export async function updateGPSLocation(
  orderId: string,
  location: GPSLocation
): Promise<void> {
  try {
    // Get current tracking to update location history
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { orderId },
      select: { locationHistory: true },
    });

    const locationHistory = (tracking?.locationHistory as any[] || []);
    locationHistory.push({
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp.toISOString(),
      accuracy: location.accuracy,
    });

    // Keep only the last 100 location points
    const trimmedHistory = locationHistory.slice(-100);

    await prisma.deliveryTracking.upsert({
      where: { orderId },
      update: {
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        lastLocationUpdate: location.timestamp,
        locationHistory: trimmedHistory,
      },
      create: {
        orderId,
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        lastLocationUpdate: location.timestamp,
        locationHistory: trimmedHistory,
      },
    });

    logEvent('gps_location_updated', {
      orderId,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch (error) {
    logError(error, { operation: 'updateGPSLocation', orderId });
    throw error;
  }
}

/**
 * Update estimated delivery window
 */
export async function updateDeliveryWindow(
  orderId: string,
  window: DeliveryWindow
): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.deliveryTracking.upsert({
        where: { orderId },
        update: {
          estimatedDeliveryStart: window.start,
          estimatedDeliveryEnd: window.end,
        },
        create: {
          orderId,
          estimatedDeliveryStart: window.start,
          estimatedDeliveryEnd: window.end,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          estimatedDeliveryStart: window.start,
          estimatedDeliveryEnd: window.end,
        },
      }),
    ]);

    logEvent('delivery_window_updated', {
      orderId,
      start: window.start.toISOString(),
      end: window.end.toISOString(),
    });
  } catch (error) {
    logError(error, { operation: 'updateDeliveryWindow', orderId });
    throw error;
  }
}

/**
 * Record delivery proof (photo and signature)
 */
export async function recordDeliveryProof(
  orderId: string,
  proof: DeliveryProof
): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.deliveryTracking.upsert({
        where: { orderId },
        update: {
          deliveryProofPhotoUrl: proof.photoUrl,
          deliverySignatureUrl: proof.signatureUrl,
          deliveryNotes: proof.notes,
          recipientName: proof.recipientName,
          actualDeliveryTime: proof.timestamp,
        },
        create: {
          orderId,
          deliveryProofPhotoUrl: proof.photoUrl,
          deliverySignatureUrl: proof.signatureUrl,
          deliveryNotes: proof.notes,
          recipientName: proof.recipientName,
          actualDeliveryTime: proof.timestamp,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryProofUrl: proof.photoUrl,
          deliveryNotes: proof.notes,
        },
      }),
    ]);

    logEvent('delivery_proof_recorded', {
      orderId,
      hasPhoto: !!proof.photoUrl,
      hasSignature: !!proof.signatureUrl,
      recipientName: proof.recipientName,
    });
  } catch (error) {
    logError(error, { operation: 'recordDeliveryProof', orderId });
    throw error;
  }
}

/**
 * Get delivery tracking information for an order
 */
export async function getDeliveryTracking(orderId: string) {
  try {
    return await prisma.deliveryTracking.findUnique({
      where: { orderId },
    });
  } catch (error) {
    logError(error, { operation: 'getDeliveryTracking', orderId });
    throw error;
  }
}

/**
 * Send tracking notification via SMS
 */
export async function sendTrackingNotification(
  orderId: string,
  stage: string
): Promise<boolean> {
  try {
    // Get order details with user phone
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        shippingAddress: true,
        user: {
          select: {
            profile: {
              select: {
                phone: true,
              },
            },
          },
        },
        deliveryTracking: {
          select: {
            courierName: true,
            courierPhone: true,
            estimatedDeliveryStart: true,
            estimatedDeliveryEnd: true,
          },
        },
      },
    });

    if (!order) {
      logError(new Error('Order not found'), { operation: 'sendTrackingNotification', orderId });
      return false;
    }

    // Get phone from shipping address or user profile
    const shippingAddress = order.shippingAddress as any;
    const phone = shippingAddress?.phone || order.user?.profile?.phone;

    if (!phone) {
      logEvent('no_phone_for_tracking_notification', { orderId, stage });
      return false;
    }

    // Prepare extras for SMS
    const extras: Record<string, string> = {};
    
    if (order.deliveryTracking?.courierName) {
      extras.courierName = order.deliveryTracking.courierName;
    }
    if (order.deliveryTracking?.courierPhone) {
      extras.courierPhone = order.deliveryTracking.courierPhone;
    }
    if (order.deliveryTracking?.estimatedDeliveryEnd) {
      const estimatedTime = new Date(order.deliveryTracking.estimatedDeliveryEnd);
      extras.estimatedTime = estimatedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Format phone number
    const formattedPhone = formatEthiopianPhone(phone);

    // Send SMS
    const success = await sendOrderTrackingSMS(
      order.orderNumber,
      formattedPhone,
      stage,
      extras
    );

    // Record the notification
    await recordSMSNotification(orderId, stage, formattedPhone, success);

    return success;
  } catch (error) {
    logError(error, { operation: 'sendTrackingNotification', orderId, stage });
    return false;
  }
}

/**
 * Process tracking update from logistics provider webhook
 */
export async function processTrackingUpdate(update: TrackingUpdate): Promise<void> {
  try {
    const { orderId, status, location, courierInfo, deliveryWindow, deliveryProof, notes } = update;

    // Update various tracking components
    if (location) {
      await updateGPSLocation(orderId, location);
    }

    if (courierInfo) {
      await updateCourierInfo(orderId, courierInfo);
    }

    if (deliveryWindow) {
      await updateDeliveryWindow(orderId, deliveryWindow);
    }

    if (deliveryProof) {
      await recordDeliveryProof(orderId, deliveryProof);
    }

    // Create order event
    await prisma.orderEvent.create({
      data: {
        orderId,
        eventType: 'tracking_update',
        status: status as any,
        description: notes || `Tracking update: ${status}`,
        metadata: {
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
          } : undefined,
          courierInfo: courierInfo ? {
            name: courierInfo.name,
            phone: courierInfo.phone,
          } : undefined,
          deliveryWindow: deliveryWindow ? {
            start: deliveryWindow.start.toISOString(),
            end: deliveryWindow.end.toISOString(),
          } : undefined,
          hasDeliveryProof: !!deliveryProof,
        },
      },
    });

    // Send SMS notification for significant status changes
    const notifyStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    if (notifyStatuses.includes(status)) {
      await sendTrackingNotification(orderId, status);
    }

    logEvent('tracking_update_processed', {
      orderId,
      status,
      hasLocation: !!location,
      hasCourierInfo: !!courierInfo,
      hasDeliveryWindow: !!deliveryWindow,
      hasDeliveryProof: !!deliveryProof,
    });
  } catch (error) {
    logError(error, { operation: 'processTrackingUpdate', orderId: update.orderId });
    throw error;
  }
}

/**
 * Calculate estimated delivery time based on distance and traffic
 * Simple implementation - can be enhanced with real traffic data
 * 
 * Uses the Haversine formula for great-circle distance calculation.
 * This computes the shortest distance between two points on a sphere's surface,
 * which is accurate for geographic coordinates on Earth.
 */
export function calculateEstimatedDelivery(
  pickupLocation: GPSLocation,
  deliveryLocation: GPSLocation,
  averageSpeedKmH: number = 25 // Default average speed in city
): DeliveryWindow {
  // Calculate distance using Haversine formula (great-circle distance)
  const R = 6371; // Earth's radius in km
  const dLat = toRad(deliveryLocation.latitude - pickupLocation.latitude);
  const dLon = toRad(deliveryLocation.longitude - pickupLocation.longitude);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(pickupLocation.latitude)) * Math.cos(toRad(deliveryLocation.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Calculate time in hours
  const timeHours = distance / averageSpeedKmH;
  const timeMinutes = Math.ceil(timeHours * 60);

  // Add buffer for traffic and stops
  const bufferMinutes = Math.max(15, timeMinutes * 0.3); // 30% buffer, minimum 15 minutes

  const now = new Date();
  const start = new Date(now.getTime() + timeMinutes * 60000);
  const end = new Date(start.getTime() + bufferMinutes * 60000);

  return { start, end };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
