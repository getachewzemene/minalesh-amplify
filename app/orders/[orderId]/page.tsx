'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, Package, Star, AlertTriangle, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import OrderTrackingTimeline from '@/components/orders/OrderTrackingTimeline'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import { SellerRatingForm } from '@/components/seller-ratings'
import { DisputeForm } from '@/components/disputes/DisputeForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  vendorId: string
  product: {
    images: string[]
  }
  vendor: {
    id: string
    displayName: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  subtotalAmount: number
  shippingAmount: number
  taxAmount: number
  discountAmount: number
  createdAt: string
  deliveredAt?: string
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode?: string
    country: string
    phone: string
  }
  orderItems: OrderItem[]
}

interface ExistingRating {
  vendorId: string
  hasRated: boolean
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [existingRatings, setExistingRatings] = useState<Map<string, boolean>>(new Map())
  const [ratingDialogOpen, setRatingDialogOpen] = useState<string | null>(null)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [existingDispute, setExistingDispute] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
      checkExistingDispute()
    }
  }, [orderId])

  const checkExistingDispute = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('/api/disputes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Check if there's an existing dispute for this order
        const dispute = data.disputes?.find((d: { order: { orderNumber: string }; id: string; status: string }) => {
          // Match by order ID from the dispute's order reference
          return d.order?.orderNumber === order?.orderNumber || 
                 data.disputes.some((disp: { order: { orderNumber: string }; id: string; status: string }) => 
                   disp.id === d.id)
        })
        if (dispute) {
          setExistingDispute({ id: dispute.id, status: dispute.status })
        }
      }
    } catch (err) {
      console.error('Error checking existing dispute:', err)
    }
  }

  // Re-check for disputes when order loads
  useEffect(() => {
    if (order) {
      const checkDisputeForOrder = async () => {
        try {
          const token = localStorage.getItem('auth_token')
          if (!token) return

          const response = await fetch('/api/disputes', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            // Find dispute for this specific order
            const dispute = data.disputes?.find((d: { order: { orderNumber: string }; id: string; status: string }) => 
              d.order?.orderNumber === order.orderNumber
            )
            if (dispute) {
              setExistingDispute({ id: dispute.id, status: dispute.status })
            }
          }
        } catch (err) {
          console.error('Error checking existing dispute:', err)
        }
      }
      checkDisputeForOrder()
    }
  }, [order])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      setOrder(data)
      
      // Check which vendors have already been rated for this order
      if (data.status === 'delivered') {
        checkExistingRatings(data.orderItems)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingRatings = async (orderItems: OrderItem[]) => {
    try {
      const token = localStorage.getItem('auth_token')
      // Get unique vendor IDs
      const vendorIds = [...new Set(orderItems.map(item => item.vendorId))]
      
      const ratingsMap = new Map<string, boolean>()
      
      // For each vendor, check if a rating exists for this order
      for (const vendorId of vendorIds) {
        const response = await fetch(
          `/api/seller-ratings?vendorId=${vendorId}&orderId=${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          // Check if any of the ratings is for this specific order
          const hasRated = data.ratings?.some((r: { orderId?: string }) => r.orderId === orderId) || false
          ratingsMap.set(vendorId, hasRated)
        } else {
          ratingsMap.set(vendorId, false)
        }
      }
      
      setExistingRatings(ratingsMap)
    } catch (err) {
      console.error('Error checking existing ratings:', err)
    }
  }

  const handleRatingSuccess = (vendorId: string) => {
    setExistingRatings(prev => new Map(prev).set(vendorId, true))
    setRatingDialogOpen(null)
  }

  const handleDisputeSuccess = () => {
    setDisputeDialogOpen(false)
    // Refresh dispute status
    const refreshDispute = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token || !order) return

        const response = await fetch('/api/disputes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const dispute = data.disputes?.find((d: { order: { orderNumber: string }; id: string; status: string }) => 
            d.order?.orderNumber === order.orderNumber
          )
          if (dispute) {
            setExistingDispute({ id: dispute.id, status: dispute.status })
          }
        }
      } catch (err) {
        console.error('Error refreshing dispute:', err)
      }
    }
    refreshDispute()
  }

  // Check if order is eligible for dispute (delivered within 30 days)
  const isEligibleForDispute = () => {
    if (!order) return false
    if (order.status !== 'delivered') return false
    if (!order.deliveredAt) return true // If no delivered date, allow dispute for delivered orders
    
    const deliveredDate = new Date(order.deliveredAt)
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceDelivery <= 30
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get unique vendors from order items
  const getUniqueVendors = () => {
    if (!order) return []
    const vendorMap = new Map<string, { id: string; displayName: string }>()
    order.orderItems.forEach(item => {
      if (item.vendor && !vendorMap.has(item.vendor.id)) {
        vendorMap.set(item.vendor.id, item.vendor)
      }
    })
    return Array.from(vendorMap.values())
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-6xl text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">{error || 'Order Not Found'}</h2>
        <p className="text-muted-foreground mb-6">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    )
  }

  const uniqueVendors = getUniqueVendors()
  const canRateSellers = order.status === 'delivered'
  const canFileDispute = isEligibleForDispute()

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">Order #{order.orderNumber}</p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Tracking Timeline */}
          <OrderTrackingTimeline orderId={orderId} />

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => {
                  const imageUrl = item.product?.images?.[0] || '/placeholder.png'
                  return (
                    <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: {item.quantity}
                        </p>
                        {item.vendor?.displayName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Sold by: {item.vendor.displayName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rate Sellers Section - Only show for delivered orders */}
          {canRateSellers && uniqueVendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Rate Your Sellers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Help other customers by rating your experience with the sellers.
                </p>
                <div className="space-y-3">
                  {uniqueVendors.map((vendor) => {
                    const hasRated = existingRatings.get(vendor.id) || false
                    return (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{vendor.displayName}</p>
                          {hasRated && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-green-600" />
                              Rated
                            </p>
                          )}
                        </div>
                        <Dialog 
                          open={ratingDialogOpen === vendor.id} 
                          onOpenChange={(open) => setRatingDialogOpen(open ? vendor.id : null)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant={hasRated ? "outline" : "default"} 
                              size="sm"
                              disabled={hasRated}
                            >
                              {hasRated ? 'Already Rated' : 'Rate Seller'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Rate Seller</DialogTitle>
                            </DialogHeader>
                            <SellerRatingForm
                              orderId={orderId}
                              vendorId={vendor.id}
                              vendorName={vendor.displayName}
                              onSuccess={() => handleRatingSuccess(vendor.id)}
                              onCancel={() => setRatingDialogOpen(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Dispute Section - Only show for delivered orders within 30 days */}
          {canFileDispute && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Having an Issue?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {existingDispute ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Dispute Filed</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {existingDispute.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                      </div>
                      <Link href={`/disputes/${existingDispute.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Dispute
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      If you have any issues with this order such as damaged items, wrong items received, or items not received, 
                      you can file a dispute within 30 days of delivery.
                    </p>
                    <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          File a Dispute
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>File a Dispute</DialogTitle>
                          <DialogDescription>
                            Please provide details about your issue. The vendor will have 3 days to respond.
                          </DialogDescription>
                        </DialogHeader>
                        <DisputeForm
                          orderId={orderId}
                          orderNumber={order.orderNumber}
                          orderItems={order.orderItems.map(item => ({
                            id: item.id,
                            name: item.productName,
                            quantity: item.quantity
                          }))}
                          onSuccess={handleDisputeSuccess}
                          onCancel={() => setDisputeDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">Payment Status</p>
                <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'} className="mt-1">
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}
                    {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                    {order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                  <p className="text-muted-foreground pt-2">{order.shippingAddress.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono">{order.orderNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
