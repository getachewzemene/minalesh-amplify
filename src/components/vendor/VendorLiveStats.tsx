'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Star,
  Eye,
  RefreshCw,
  Activity
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'

interface ProductMetrics {
  productId: string
  name: string
  views: number
  conversions: number
  revenue: number
  conversionRate: number
  avgRating: number
}

interface TrafficSource {
  source: string
  sessions: number
  conversions: number
  conversionRate: number
  revenue: number
}

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "hsl(var(--chart-1))",
  },
  conversions: {
    label: "Conversions",
    color: "hsl(var(--chart-2))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-3))",
  },
}

// Mock data for demonstration
const mockProductMetrics: ProductMetrics[] = [
  {
    productId: "1",
    name: "Premium Coffee Beans",
    views: 2450,
    conversions: 145,
    revenue: 3625000,
    conversionRate: 5.92,
    avgRating: 4.7
  },
  {
    productId: "2",
    name: "Organic Honey",
    views: 1890,
    conversions: 98,
    revenue: 1960000,
    conversionRate: 5.19,
    avgRating: 4.5
  },
  {
    productId: "3",
    name: "Traditional Spice Mix",
    views: 3120,
    conversions: 187,
    revenue: 2805000,
    conversionRate: 5.99,
    avgRating: 4.8
  },
]

const mockTrafficSources: TrafficSource[] = [
  {
    source: "Organic Search",
    sessions: 5420,
    conversions: 245,
    conversionRate: 4.52,
    revenue: 6125000
  },
  {
    source: "Direct",
    sessions: 3890,
    conversions: 189,
    conversionRate: 4.86,
    revenue: 4720000
  },
  {
    source: "Social Media",
    sessions: 2340,
    conversions: 98,
    conversionRate: 4.19,
    revenue: 2450000
  },
  {
    source: "Referral",
    sessions: 1560,
    conversions: 67,
    conversionRate: 4.29,
    revenue: 1680000
  },
]

export default function VendorLiveStats() {
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { profile } = useAuth()

  const [productMetrics] = useState<ProductMetrics[]>(mockProductMetrics)
  const [trafficSources] = useState<TrafficSource[]>(mockTrafficSources)

  const totalViews = productMetrics.reduce((sum, p) => sum + p.views, 0)
  const totalConversions = productMetrics.reduce((sum, p) => sum + p.conversions, 0)
  const totalRevenue = productMetrics.reduce((sum, p) => sum + p.revenue, 0)
  const avgConversionRate = productMetrics.reduce((sum, p) => sum + p.conversionRate, 0) / productMetrics.length

  const fetchLiveStats = async () => {
    setLoading(true)
    try {
      // In production, fetch real data from API
      // const response = await fetch('/api/vendors/live-stats')
      // if (response.ok) {
      //   const data = await response.json()
      //   setProductMetrics(data.productMetrics)
      //   setTrafficSources(data.trafficSources)
      // }
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch live stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLiveStats, 60000) // Refresh every 60 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Live Performance</h2>
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
          <Button variant="outline" size="sm" onClick={fetchLiveStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Product Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalViews.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalConversions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {avgConversionRate.toFixed(2)}% CVR
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ETB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {productMetrics.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              In catalog
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficSources}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="hsl(var(--chart-1))" name="Sessions" />
                  <Bar dataKey="conversions" fill="hsl(var(--chart-2))" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficSources}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-3))" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Views</th>
                  <th className="pb-3 pr-4">Orders</th>
                  <th className="pb-3 pr-4">CVR</th>
                  <th className="pb-3 pr-4">Revenue</th>
                  <th className="pb-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {productMetrics.map((product) => (
                  <tr key={product.productId} className="border-b hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-sm">{product.name}</p>
                    </td>
                    <td className="py-3 pr-4 text-sm">{product.views.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-sm font-medium">{product.conversions}</td>
                    <td className="py-3 pr-4 text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {product.conversionRate.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-green-600">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.avgRating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Traffic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trafficSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{source.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.sessions.toLocaleString()} sessions • {source.conversions} conversions
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-green-600">
                    {formatCurrency(source.revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {source.conversionRate.toFixed(2)}% CVR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
