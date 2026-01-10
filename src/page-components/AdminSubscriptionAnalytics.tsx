'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, RefreshCw, Loader2, Users, DollarSign, TrendingUp, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface PremiumStats {
  active: number
  paused: number
  cancelled: number
  planBreakdown: Record<string, number>
  totalRevenue: number
  totalPayments: number
}

interface ProductStats {
  active: number
  frequencyBreakdown: Record<string, number>
  topProductIds: Array<{ productId: string; count: number }>
  totalDeliveries: number
}

interface SubscriptionMetrics {
  monthlyRecurringRevenue: number
  totalActiveSubscribers: number
}

export default function AdminSubscriptionAnalytics() {
  const [premiumStats, setPremiumStats] = useState<PremiumStats | null>(null)
  const [productStats, setProductStats] = useState<ProductStats | null>(null)
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null)
  const [recentPremium, setRecentPremium] = useState<any[]>([])
  const [recentProduct, setRecentProduct] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptionStats()
  }, [])

  const fetchSubscriptionStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/subscriptions/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPremiumStats(data.premium?.stats)
        setProductStats(data.productSubscriptions?.stats)
        setMetrics(data.metrics)
        setRecentPremium(data.premium?.recent || [])
        setRecentProduct(data.productSubscriptions?.recent || [])
      }
    } catch (error) {
      console.error('Error fetching subscription stats:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground">
            Overview of premium memberships and product subscriptions
          </p>
        </div>
        <Button variant="outline" onClick={fetchSubscriptionStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.monthlyRecurringRevenue?.toFixed(2) || 0} ETB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalActiveSubscribers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {premiumStats?.paused || 0} paused
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Subscriptions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {productStats?.totalDeliveries || 0} deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Premium Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Premium Memberships
            </CardTitle>
            <CardDescription>Breakdown by plan type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{premiumStats?.active || 0}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{premiumStats?.paused || 0}</div>
                  <div className="text-xs text-muted-foreground">Paused</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{premiumStats?.cancelled || 0}</div>
                  <div className="text-xs text-muted-foreground">Cancelled</div>
                </div>
              </div>

              {premiumStats?.planBreakdown && Object.keys(premiumStats.planBreakdown).length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">By Plan</h4>
                  <div className="space-y-2">
                    {Object.entries(premiumStats.planBreakdown).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{plan.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Revenue</span>
                  <span className="font-semibold">{premiumStats?.totalRevenue?.toFixed(2) || 0} ETB</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Subscribe &amp; Save
            </CardTitle>
            <CardDescription>Breakdown by frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productStats?.frequencyBreakdown && Object.keys(productStats.frequencyBreakdown).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(productStats.frequencyBreakdown).map(([frequency, count]) => (
                    <div key={frequency} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{frequency}</span>
                      <Badge variant="outline">{count} subscriptions</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No product subscriptions yet</p>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Deliveries</span>
                  <span className="font-semibold">{productStats?.totalDeliveries || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Premium Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPremium.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent subscriptions</p>
            ) : (
              <div className="space-y-2">
                {recentPremium.slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{sub.user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.planType?.replace('_', ' ')} • {formatDate(sub.createdAt)}
                      </p>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Product Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProduct.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent subscriptions</p>
            ) : (
              <div className="space-y-2">
                {recentProduct.slice(0, 5).map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{sub.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.user?.email} • {sub.frequency}
                      </p>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
