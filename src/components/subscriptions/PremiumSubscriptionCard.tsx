'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, Check, Truck, Clock, Star, HeadphonesIcon, 
  Sparkles, CalendarDays, Pause, Play, XCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
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

interface PremiumSubscription {
  id: string
  planType: 'premium_monthly' | 'premium_yearly'
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due'
  priceAmount: number
  currency: string
  startDate: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelledAt?: string
  pausedAt?: string
  autoRenew: boolean
}

interface PremiumBenefits {
  freeShipping: boolean
  extendedReturns: number
  loyaltyPointsMultiplier: number
  prioritySupport: boolean
  exclusiveDeals: boolean
  earlyAccess: boolean
}

interface PremiumPricing {
  monthly: { price: number; daysInPeriod: number }
  yearly: { price: number; daysInPeriod: number }
}

const BENEFITS_LIST = [
  { icon: Truck, text: 'Free shipping on all orders', key: 'freeShipping' },
  { icon: Clock, text: 'Extended returns (14 days)', key: 'extendedReturns' },
  { icon: Star, text: '2x loyalty points on purchases', key: 'loyaltyPointsMultiplier' },
  { icon: HeadphonesIcon, text: 'Priority customer support', key: 'prioritySupport' },
  { icon: Sparkles, text: 'Exclusive deals and discounts', key: 'exclusiveDeals' },
  { icon: CalendarDays, text: 'Early access to sales', key: 'earlyAccess' },
]

export function PremiumSubscriptionCard() {
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [pricing, setPricing] = useState<PremiumPricing | null>(null)
  const [benefits, setBenefits] = useState<PremiumBenefits | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/premium', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setIsActive(data.isActive)
        setPricing(data.pricing)
        setBenefits(data.benefits)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType: selectedPlan === 'monthly' ? 'premium_monthly' : 'premium_yearly',
        }),
      })
      if (response.ok) {
        toast.success('Premium subscription activated!')
        fetchSubscription()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to subscribe')
      }
    } catch (error) {
      toast.error('Failed to subscribe')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/premium', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'pause' }),
      })
      if (response.ok) {
        toast.success('Subscription paused')
        fetchSubscription()
      } else {
        toast.error('Failed to pause subscription')
      }
    } catch (error) {
      toast.error('Failed to pause subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResume = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/premium', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'resume' }),
      })
      if (response.ok) {
        toast.success('Subscription resumed')
        fetchSubscription()
      } else {
        toast.error('Failed to resume subscription')
      }
    } catch (error) {
      toast.error('Failed to resume subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/premium', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success('Subscription cancelled')
        fetchSubscription()
      } else {
        toast.error('Failed to cancel subscription')
      }
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Show subscription details if active
  if (isActive && subscription) {
    return (
      <Card className="w-full border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Minalesh Premium</CardTitle>
            </div>
            <Badge variant="default" className="bg-primary">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </Badge>
          </div>
          <CardDescription>
            {subscription.planType === 'premium_yearly' ? 'Annual Plan' : 'Monthly Plan'} • 
            Renews {formatDate(subscription.currentPeriodEnd)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BENEFITS_LIST.map((benefit) => (
              <div key={benefit.key} className="flex items-center gap-2 text-sm">
                <benefit.icon className="h-4 w-4 text-primary" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Member since {formatDate(subscription.startDate)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {subscription.status === 'active' && (
            <Button variant="outline" size="sm" onClick={handlePause} disabled={actionLoading}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {subscription.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={handleResume} disabled={actionLoading}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your premium benefits will continue until {formatDate(subscription.currentPeriodEnd)}.
                  After that, you&apos;ll lose access to free shipping, extended returns, and other benefits.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Cancel Subscription</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    )
  }

  // Show subscription options for non-subscribers
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Minalesh Premium</CardTitle>
        <CardDescription>
          Unlock exclusive benefits and save on every order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-semibold">Monthly</p>
            <p className="text-2xl font-bold">{pricing?.monthly.price || 99} ETB</p>
            <p className="text-sm text-muted-foreground">/month</p>
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-lg border-2 transition-colors relative ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Badge className="absolute -top-2 right-2 bg-green-500">Save 16%</Badge>
            <p className="font-semibold">Yearly</p>
            <p className="text-2xl font-bold">{pricing?.yearly.price || 999} ETB</p>
            <p className="text-sm text-muted-foreground">/year</p>
          </button>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          {BENEFITS_LIST.map((benefit) => (
            <div key={benefit.key} className="flex items-center gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" onClick={handleSubscribe} disabled={actionLoading}>
          {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Start Premium Membership
        </Button>
      </CardFooter>
    </Card>
  )
}
