'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface LiveStats {
  today: {
    orders: number
    revenue: number
    newUsers: number
    newVendors: number
  }
  last24Hours: {
    activeUsers: number
  }
  pending: {
    orders: number
    vendorVerifications: number
  }
  alerts: {
    lowStockProducts: number
  }
  growth: {
    ordersWeekly: string
  }
}

interface RecentActivity {
  type: string
  id: string
  orderNumber: string
  status: string
  amount: number
  timestamp: string
  user: {
    name: string
    email: string
  }
}

export default function LiveStatsDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLiveStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/live-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActivity(data.recentActivity || [])
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch live stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveStats()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLiveStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (loading) {
    return <div className="text-center py-8">Loading live statistics...</div>
  }

  if (!stats) {
    return <div className="text-center py-8">Unable to load live statistics</div>
  }

  const growthValue = parseFloat(stats.growth.ordersWeekly)

  return (
    <div className="space-y-6">
      {/* Header with Auto-refresh Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Live Statistics</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto On' : 'Auto Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLiveStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Today's Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.today.orders}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className={`h-3 w-3 ${growthValue >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={growthValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                {growthValue >= 0 ? '+' : ''}{stats.growth.ordersWeekly}% this week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(Number(stats.today.revenue))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ETB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              New Users Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.today.newUsers}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.last24Hours.activeUsers} active (24h)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              New Vendors Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.today.newVendors}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Registered
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending.orders}
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              Requires attention
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.alerts.lowStockProducts}
            </div>
            <Badge variant="destructive" className="mt-2 text-xs">
              Restock needed
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Pending Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending.vendorVerifications}
            </div>
            <Badge variant="outline" className="mt-2 text-xs">
              Review required
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.orderNumber}
                      </Badge>
                      <Badge
                        variant={
                          item.status === 'delivered' ? 'default' :
                          item.status === 'pending' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">
                      <span className="font-medium">{item.user.name}</span>
                      <span className="text-muted-foreground"> • {item.user.email}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {formatCurrency(Number(item.amount))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
