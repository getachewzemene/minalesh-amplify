/**
 * Order Tracking API
 * 
 * GET - Get delivery tracking information
 * PUT - Update tracking information (admin/courier)
 * POST - Record delivery proof
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken, isAdmin } from '@/lib/auth';
import {
  getDeliveryTracking,
  updateCourierInfo,
  updateGPSLocation,
  updateDeliveryWindow,
  recordDeliveryProof,
  sendTrackingNotification,
  createDeliveryTracking,
} from '@/lib/logistics';
import type { CourierInfo, GPSLocation, DeliveryWindow, DeliveryProof } from '@/lib/logistics';

// GET - Get delivery tracking information
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        estimatedDeliveryStart: true,
        estimatedDeliveryEnd: true,
        deliveryProofUrl: true,
        deliveryNotes: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const userIsAdmin = isAdmin(payload.role);
    if (!userIsAdmin && order.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own order tracking' },
        { status: 403 }
      );
    }

    // Get delivery tracking details
    const tracking = await getDeliveryTracking(params.orderId);

    // Combine order and tracking info
    const response = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      estimatedDelivery: {
        start: tracking?.estimatedDeliveryStart || order.estimatedDeliveryStart,
        end: tracking?.estimatedDeliveryEnd || order.estimatedDeliveryEnd,
      },
      courier: tracking ? {
        name: tracking.courierName,
        phone: tracking.courierPhone,
        photoUrl: tracking.courierPhotoUrl,
        vehicleInfo: tracking.courierVehicleInfo,
      } : null,
      location: tracking?.currentLatitude && tracking?.currentLongitude ? {
        latitude: Number(tracking.currentLatitude),
        longitude: Number(tracking.currentLongitude),
        lastUpdate: tracking.lastLocationUpdate,
      } : null,
      deliveryProof: tracking?.deliveryProofPhotoUrl ? {
        photoUrl: tracking.deliveryProofPhotoUrl,
        signatureUrl: tracking.deliverySignatureUrl,
        recipientName: tracking.recipientName,
        notes: tracking.deliveryNotes,
        deliveredAt: tracking.actualDeliveryTime,
      } : null,
      logistics: {
        provider: tracking?.logisticsProvider,
        trackingId: tracking?.providerTrackingId,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching tracking information' },
      { status: 500 }
    );
  }
}

// PUT - Update tracking information (admin/courier only)
export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    // Allow internal API calls for logistics providers
    const internalSecret = request.headers.get('x-internal-secret') || '';
    const internalAuthorized = !!process.env.INTERNAL_API_SECRET && 
      internalSecret === process.env.INTERNAL_API_SECRET;

    if (!payload && !internalAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin or internal API can update tracking
    if (!internalAuthorized && !isAdmin(payload?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      courierInfo, 
      location, 
      deliveryWindow, 
      logisticsProvider, 
      providerTrackingId,
      sendNotification,
      notificationStage,
    } = body;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Initialize tracking if needed
    if (logisticsProvider || providerTrackingId) {
      await createDeliveryTracking(params.orderId, logisticsProvider, providerTrackingId);
    }

    // Update courier info
    if (courierInfo) {
      const courier: CourierInfo = {
        name: courierInfo.name,
        phone: courierInfo.phone,
        photoUrl: courierInfo.photoUrl,
        vehicleInfo: courierInfo.vehicleInfo,
      };
      await updateCourierInfo(params.orderId, courier);
    }

    // Update GPS location
    if (location) {
      const gps: GPSLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(location.timestamp || Date.now()),
        accuracy: location.accuracy,
      };
      await updateGPSLocation(params.orderId, gps);
    }

    // Update delivery window
    if (deliveryWindow) {
      const window: DeliveryWindow = {
        start: new Date(deliveryWindow.start),
        end: new Date(deliveryWindow.end),
      };
      await updateDeliveryWindow(params.orderId, window);
    }

    // Send SMS notification if requested
    if (sendNotification && notificationStage) {
      await sendTrackingNotification(params.orderId, notificationStage);
    }

    // Get updated tracking
    const tracking = await getDeliveryTracking(params.orderId);

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error('Error updating tracking:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating tracking information' },
      { status: 500 }
    );
  }
}

// POST - Record delivery proof (photo, signature)
export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    // Allow internal API calls for delivery drivers
    const internalSecret = request.headers.get('x-internal-secret') || '';
    const internalAuthorized = !!process.env.INTERNAL_API_SECRET && 
      internalSecret === process.env.INTERNAL_API_SECRET;

    if (!payload && !internalAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { photoUrl, signatureUrl, recipientName, notes } = body;

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'Delivery proof photo URL is required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Record delivery proof
    const proof: DeliveryProof = {
      photoUrl,
      signatureUrl,
      recipientName,
      notes,
      timestamp: new Date(),
    };
    await recordDeliveryProof(params.orderId, proof);

    // Create order event
    await prisma.orderEvent.create({
      data: {
        orderId: params.orderId,
        eventType: 'delivery_proof_recorded',
        status: order.status,
        description: 'Delivery proof photo uploaded',
        metadata: {
          hasPhoto: true,
          hasSignature: !!signatureUrl,
          recipientName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery proof recorded successfully',
    });
  } catch (error) {
    console.error('Error recording delivery proof:', error);
    return NextResponse.json(
      { error: 'An error occurred while recording delivery proof' },
      { status: 500 }
    );
  }
}
