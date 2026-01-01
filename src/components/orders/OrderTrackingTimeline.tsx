'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Package, Truck, MapPin, Clock } from 'lucide-react'
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

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
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
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-orange-600" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'location_update':
        return <MapPin className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getEventTitle = (eventType: string, description: string | null) => {
    if (description) return description

    switch (eventType.toLowerCase()) {
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
      case 'shipped':
        return 'Order Shipped'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'delivered':
        return 'Delivered'
      case 'location_update':
        return 'Location Update'
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
                  {getEventIcon(event.eventType)}
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
                      {getEventTitle(event.eventType, event.description)}
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
                          <p className="text-xs text-muted-foreground">
                            Courier: {event.metadata.courier}
                          </p>
                        )}
                        {event.metadata.trackingNumber && (
                          <p className="text-xs text-muted-foreground">
                            Tracking #: {event.metadata.trackingNumber}
                          </p>
                        )}
                        {event.metadata.estimatedDelivery && (
                          <p className="text-xs text-muted-foreground">
                            Estimated delivery: {format(new Date(event.metadata.estimatedDelivery), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {event.status && (
                    <Badge variant="secondary" className="text-xs">
                      {event.status}
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
