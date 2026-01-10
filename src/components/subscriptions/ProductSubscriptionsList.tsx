'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, Pause, Play, SkipForward, Trash2, Loader2,
  Package, Calendar, Percent, Edit
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'

interface ProductSubscription {
  id: string
  productId: string
  quantity: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly'
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  discountPercent: number
  priceAtSubscription: number
  nextDeliveryDate: string
  lastDeliveryDate?: string
  totalDeliveries: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice?: number
    images?: string[]
    stockQuantity: number
  }
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month',
  bimonthly: 'Every 2 months',
  quarterly: 'Every 3 months',
}

export function ProductSubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<ProductSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [discount, setDiscount] = useState(10)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
        setDiscount(data.discount || 10)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subscriptions Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Subscribe to your favorite products and save {discount}% on every delivery. 
            Look for the &quot;Subscribe &amp; Save&quot; option on product pages.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subscribe &amp; Save</h2>
          <p className="text-sm text-muted-foreground">
            {subscriptions.filter(s => s.status === 'active').length} active subscriptions
          </p>
        </div>
        <Badge variant="secondary" className="text-lg">
          <Percent className="h-4 w-4 mr-1" />
          {discount}% OFF
        </Badge>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((sub) => (
          <ProductSubscriptionItem
            key={sub.id}
            subscription={sub}
            onUpdate={fetchSubscriptions}
          />
        ))}
      </div>
    </div>
  )
}

function ProductSubscriptionItem({
  subscription,
  onUpdate,
}: {
  subscription: ProductSubscription
  onUpdate: () => void
}) {
  const [actionLoading, setActionLoading] = useState(false)
  const [editingFrequency, setEditingFrequency] = useState(false)

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/subscriptions/products/${subscription.id}`, {
        method: action === 'cancel' ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...extraData }),
      })
      if (response.ok) {
        const messages: Record<string, string> = {
          pause: 'Subscription paused',
          resume: 'Subscription resumed',
          skip: 'Next delivery skipped',
          cancel: 'Subscription cancelled',
          update: 'Subscription updated',
        }
        toast.success(messages[action] || 'Updated')
        onUpdate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update subscription')
    } finally {
      setActionLoading(false)
      setEditingFrequency(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const discountedPrice = Number(subscription.priceAtSubscription) * 
    (1 - Number(subscription.discountPercent) / 100) * subscription.quantity

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    cancelled: 'bg-red-500',
    expired: 'bg-gray-500',
  }

  return (
    <Card className={subscription.status !== 'active' ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {subscription.product.images?.[0] ? (
              <Image
                src={subscription.product.images[0]}
                alt={subscription.product.name}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{subscription.product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Qty: {subscription.quantity} • {discountedPrice.toFixed(2)} ETB/delivery
                </p>
              </div>
              <Badge className={statusColors[subscription.status]}>
                {subscription.status}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {editingFrequency ? (
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={subscription.frequency}
                    onValueChange={(value) => handleAction('update', { frequency: value })}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setEditingFrequency(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingFrequency(true)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  {frequencyLabels[subscription.frequency]}
                  <Edit className="h-3 w-3" />
                </button>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Next: {formatDate(subscription.nextDeliveryDate)}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {subscription.status === 'active' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('skip')}
                    disabled={actionLoading}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip Next
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('pause')}
                    disabled={actionLoading}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                </>
              )}
              {subscription.status === 'paused' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}
              {subscription.status !== 'cancelled' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionLoading}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You&apos;ll no longer receive automatic deliveries of {subscription.product.name}.
                        You can always resubscribe later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleAction('cancel')}>
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SubscribeAndSaveButton({
  productId,
  productName,
  price,
  onSubscribed,
}: {
  productId: string
  productName: string
  price: number
  onSubscribed?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState('monthly')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, frequency, quantity }),
      })
      if (response.ok) {
        toast.success('Subscribed successfully! You\'ll save 10% on every delivery.')
        setOpen(false)
        onSubscribed?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to subscribe')
      }
    } catch (error) {
      toast.error('Failed to subscribe')
    } finally {
      setLoading(false)
    }
  }

  const discountedPrice = price * 0.9 * quantity

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Subscribe &amp; Save 10%
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Subscribe &amp; Save</AlertDialogTitle>
          <AlertDialogDescription>
            Set up automatic deliveries for {productName} and save 10% on every order.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Delivery Frequency</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <Select value={quantity.toString()} onValueChange={(v) => setQuantity(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Regular price</span>
              <span className="line-through text-muted-foreground">{(price * quantity).toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Subscribe &amp; Save price</span>
              <span className="text-green-600">{discountedPrice.toFixed(2)} ETB</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={handleSubscribe} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Start Subscription
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
