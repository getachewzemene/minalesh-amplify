'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  TrendingUp,
  Eye,
  ShoppingCart,
  DollarSign,
  Star,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const chartConfig = {
  views: {
    label: "Views",
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

// Mock data - in production, fetch from API
const productPerformanceData = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    sku: "PHONE-IP15PM-256",
    views: 15420,
    clicks: 3245,
    addToCart: 892,
    orders: 450,
    revenue: 4049550000,
    rating: 4.8,
    ctr: 21.05,
    conversionRate: 2.92,
    avgOrderValue: 8999000,
    roi: 245.5,
    trend: "up"
  },
  {
    id: "2",
    name: "Samsung Galaxy S24",
    sku: "PHONE-SGS24-128",
    views: 12340,
    clicks: 2456,
    addToCart: 634,
    orders: 320,
    revenue: 799680000,
    rating: 4.6,
    ctr: 19.9,
    conversionRate: 2.59,
    avgOrderValue: 2499000,
    roi: 198.3,
    trend: "up"
  },
  {
    id: "3",
    name: "MacBook Pro M3",
    sku: "LAPTOP-MBP-M3-512",
    views: 9875,
    clicks: 1876,
    addToCart: 412,
    orders: 180,
    revenue: 923720000,
    rating: 4.9,
    ctr: 19.0,
    conversionRate: 1.82,
    avgOrderValue: 5131778,
    roi: 156.2,
    trend: "down"
  },
  {
    id: "4",
    name: "AirPods Pro",
    sku: "AUDIO-APP-GEN3",
    views: 18900,
    clicks: 4156,
    addToCart: 1245,
    orders: 680,
    revenue: 215760000,
    rating: 4.7,
    ctr: 22.0,
    conversionRate: 3.6,
    avgOrderValue: 317294,
    roi: 312.8,
    trend: "up"
  },
  {
    id: "5",
    name: "Ray-Ban Aviator",
    sku: "GLASSES-RB-AV-GOLD",
    views: 14230,
    clicks: 3124,
    addToCart: 1089,
    orders: 890,
    revenue: 187650000,
    rating: 4.5,
    ctr: 21.96,
    conversionRate: 6.26,
    avgOrderValue: 210843,
    roi: 423.1,
    trend: "up"
  },
]

const weeklyTrendData = [
  { week: "Week 1", views: 45000, conversions: 1200, revenue: 24500000 },
  { week: "Week 2", views: 52000, conversions: 1450, revenue: 28900000 },
  { week: "Week 3", views: 48000, conversions: 1320, revenue: 26100000 },
  { week: "Week 4", views: 61000, conversions: 1680, revenue: 32400000 },
]

export default function ProductPerformanceAnalytics() {
  const [sortBy, setSortBy] = useState<'revenue' | 'conversions' | 'roi'>('revenue')

  const sortedProducts = [...productPerformanceData].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue
    if (sortBy === 'conversions') return b.orders - a.orders
    if (sortBy === 'roi') return b.roi - a.roi
    return 0
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Product Performance Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Detailed metrics for product success
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(productPerformanceData.reduce((sum, p) => sum + p.views, 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productPerformanceData.reduce((sum, p) => sum + p.orders, 0)}
            </div>
            <p className="text-xs text-green-600">
              Avg CVR: {(productPerformanceData.reduce((sum, p) => sum + p.conversionRate, 0) / productPerformanceData.length).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(productPerformanceData.reduce((sum, p) => sum + p.revenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">ETB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(productPerformanceData.reduce((sum, p) => sum + p.roi, 0) / productPerformanceData.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Products</CardTitle>
            <div className="flex gap-2">
              <Badge
                variant={sortBy === 'revenue' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSortBy('revenue')}
              >
                By Revenue
              </Badge>
              <Badge
                variant={sortBy === 'conversions' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSortBy('conversions')}
              >
                By Orders
              </Badge>
              <Badge
                variant={sortBy === 'roi' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSortBy('roi')}
              >
                By ROI
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Views</th>
                  <th className="pb-3 pr-4">CTR</th>
                  <th className="pb-3 pr-4">Orders</th>
                  <th className="pb-3 pr-4">CVR</th>
                  <th className="pb-3 pr-4">Revenue</th>
                  <th className="pb-3 pr-4">ROI</th>
                  <th className="pb-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{product.rating}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm">{product.views.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-sm">{product.ctr}%</td>
                    <td className="py-3 pr-4 text-sm font-medium">{product.orders}</td>
                    <td className="py-3 pr-4 text-sm">{product.conversionRate}%</td>
                    <td className="py-3 pr-4 text-sm font-medium">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={product.roi > 200 ? 'default' : 'secondary'} className="text-xs">
                        {product.roi}%
                      </Badge>
                    </td>
                    <td className="py-3">
                      {product.trend === 'up' ? (
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
