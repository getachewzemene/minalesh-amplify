'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Package, Truck, MapPin, Clock, User, Navigation, Camera, Box } from 'lucide-react'
import { format } from 'date-fns'

interface OrderEvent {
  id: string
  eventType: string
  status: string
  description: string | null
  metadata: any
  createdAt: string
}

interface OrderTrackingTimelineProps {
  orderId: string
}

/**
 * Enhanced Order Tracking Timeline Component
 * 
 * Displays the timeline of order events with support for:
 * - 7 order stages (placed, confirmed, packed, picked up, in transit, out for delivery, delivered)
 * - GPS location updates
 * - Courier information
 * - Estimated delivery time
 * - Photo proof of delivery
 */
export default function OrderTrackingTimeline({ orderId }: OrderTrackingTimelineProps) {
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderEvents()
  }, [orderId])

  const fetchOrderEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/orders/${orderId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order events')
      }

      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking information')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string, status?: string) => {
    const type = eventType.toLowerCase()
    const orderStatus = status?.toLowerCase()
    
    // Check status first for status_changed events
    if (type === 'status_changed' && orderStatus) {
      switch (orderStatus) {
        case 'pending':
        case 'order_placed':
        case 'created':
          return <Package className="h-5 w-5 text-blue-600" />
        case 'paid':
        case 'payment_confirmed':
          return <CheckCircle className="h-5 w-5 text-green-600" />
        case 'confirmed':
          return <CheckCircle className="h-5 w-5 text-cyan-600" />
        case 'processing':
          return <Package className="h-5 w-5 text-indigo-600" />
        case 'packed':
          return <Box className="h-5 w-5 text-violet-600" />
        case 'picked_up':
          return <User className="h-5 w-5 text-purple-600" />
        case 'in_transit':
          return <Truck className="h-5 w-5 text-fuchsia-600" />
        case 'out_for_delivery':
          return <Navigation className="h-5 w-5 text-orange-600" />
        case 'shipped':
          return <Truck className="h-5 w-5 text-purple-600" />
        case 'delivered':
          return <CheckCircle className="h-5 w-5 text-green-600" />
        case 'cancelled':
          return <Circle className="h-5 w-5 text-red-600" />
        case 'refunded':
          return <Circle className="h-5 w-5 text-gray-600" />
      }
    }
    
    // Check event type
    switch (type) {
      case 'order_placed':
      case 'created':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'confirmed':
      case 'payment_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
      case 'packed':
        return <Package className="h-5 w-5 text-purple-600" />
      case 'shipped':
      case 'picked_up':
      case 'in_transit':
        return <Truck className="h-5 w-5 text-orange-600" />
      case 'out_for_delivery':
        return <Navigation className="h-5 w-5 text-orange-600" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'location_update':
      case 'tracking_update':
        return <MapPin className="h-5 w-5 text-blue-600" />
      case 'courier_assigned':
        return <User className="h-5 w-5 text-purple-600" />
      case 'delivery_proof_recorded':
        return <Camera className="h-5 w-5 text-green-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getEventTitle = (eventType: string, status: string | null, description: string | null) => {
    if (description) return description

    const type = eventType.toLowerCase()
    const orderStatus = status?.toLowerCase()

    // For status_changed events, use the new status
    if (type === 'status_changed' && orderStatus) {
      switch (orderStatus) {
        case 'pending':
          return 'Order Placed'
        case 'paid':
          return 'Payment Confirmed'
        case 'confirmed':
          return 'Vendor Confirmed Order'
        case 'processing':
          return 'Order Processing'
        case 'packed':
          return 'Order Packed & Ready'
        case 'picked_up':
          return 'Picked Up by Courier'
        case 'in_transit':
          return 'In Transit to Destination'
        case 'out_for_delivery':
          return 'Out for Delivery'
        case 'shipped':
          return 'Order Shipped'
        case 'delivered':
          return 'Delivered Successfully'
        case 'cancelled':
          return 'Order Cancelled'
        case 'refunded':
          return 'Order Refunded'
        default:
          return `Status: ${orderStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
      }
    }

    switch (type) {
      case 'order_placed':
      case 'created':
        return 'Order Placed'
      case 'confirmed':
        return 'Order Confirmed'
      case 'payment_confirmed':
        return 'Payment Confirmed'
      case 'processing':
        return 'Order Processing'
      case 'packed':
        return 'Order Packed'
      case 'picked_up':
        return 'Picked Up by Courier'
      case 'shipped':
        return 'Order Shipped'
      case 'in_transit':
        return 'In Transit'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'delivered':
        return 'Delivered'
      case 'location_update':
        return 'Location Update'
      case 'tracking_update':
        return 'Tracking Update'
      case 'courier_assigned':
        return 'Courier Assigned'
      case 'delivery_proof_recorded':
        return 'Delivery Proof Recorded'
      case 'cancelled':
        return 'Order Cancelled'
      case 'refunded':
        return 'Order Refunded'
      default:
        return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No tracking updates available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary bg-background">
                  {getEventIcon(event.eventType, event.status)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full bg-border min-h-[40px]" />
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {getEventTitle(event.eventType, event.status, event.description)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                    
                    {/* Additional metadata */}
                    {event.metadata && (
                      <div className="mt-2 space-y-1">
                        {event.metadata.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.metadata.location}
                          </p>
                        )}
                        {event.metadata.courier && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Courier: {event.metadata.courier}
                          </p>
                        )}
                        {event.metadata.courierInfo?.name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Courier: {event.metadata.courierInfo.name}
                            {event.metadata.courierInfo.phone && ` (${event.metadata.courierInfo.phone})`}
                          </p>
                        )}
                        {event.metadata.trackingNumber && (
                          <p className="text-xs text-muted-foreground">
                            Tracking #: {event.metadata.trackingNumber}
                          </p>
                        )}
                        {event.metadata.estimatedDelivery && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Estimated delivery: {format(new Date(event.metadata.estimatedDelivery), "MMM dd, yyyy")}
                          </p>
                        )}
                        {event.metadata.deliveryWindow && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Delivery window: {format(new Date(event.metadata.deliveryWindow.start), "h:mm a")} - {format(new Date(event.metadata.deliveryWindow.end), "h:mm a")}
                          </p>
                        )}
                        {event.metadata.hasDeliveryProof && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            Photo proof recorded
                          </p>
                        )}
                        {event.metadata.previousStatus && event.metadata.newStatus && (
                          <p className="text-xs text-muted-foreground">
                            {event.metadata.previousStatus.replace(/_/g, ' ')} → {event.metadata.newStatus.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {event.status && (
                    <Badge variant="secondary" className="text-xs">
                      {event.status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
