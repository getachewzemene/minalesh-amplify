'use client'

/**
 * Enhanced Analytics Component for Vendor Dashboard
 * 
 * Professional analytics inspired by Amazon Seller Central, eBay Seller Hub, and Alibaba.com
 * Features:
 * - Real-time sales metrics and KPIs
 * - Revenue trends with period comparisons
 * - Customer analytics and demographics
 * - Product performance insights
 * - Traffic source analysis
 * - Conversion funnel visualization
 * - Time-based comparative analysis
 */

import { useState } from "react"
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart,
  Users,
  Eye,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  CreditCard,
  RefreshCcw,
  ShoppingBag,
  Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RPieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
  views: {
    label: "Views",
    color: "hsl(var(--chart-3))",
  },
  conversion: {
    label: "Conversion",
    color: "hsl(var(--chart-4))",
  },
}

// Mock data for comprehensive analytics
const salesTrendData = [
  { date: "Jan 1", revenue: 45000, orders: 125, views: 3200, conversion: 3.9 },
  { date: "Jan 2", revenue: 52000, orders: 142, views: 3450, conversion: 4.1 },
  { date: "Jan 3", revenue: 48000, orders: 135, views: 3100, conversion: 4.4 },
  { date: "Jan 4", revenue: 61000, orders: 168, views: 3900, conversion: 4.3 },
  { date: "Jan 5", revenue: 55000, orders: 156, views: 3700, conversion: 4.2 },
  { date: "Jan 6", revenue: 58000, orders: 162, views: 3850, conversion: 4.2 },
  { date: "Jan 7", revenue: 63000, orders: 178, views: 4100, conversion: 4.3 },
  { date: "Jan 8", revenue: 70000, orders: 195, views: 4500, conversion: 4.3 },
  { date: "Jan 9", revenue: 67000, orders: 188, views: 4200, conversion: 4.5 },
  { date: "Jan 10", revenue: 72000, orders: 201, views: 4600, conversion: 4.4 },
]

const productCategoryData = [
  { category: "Electronics", value: 450000, count: 156, growth: 12.5 },
  { category: "Fashion", value: 320000, count: 425, growth: 8.3 },
  { category: "Home & Garden", value: 180000, count: 89, growth: 15.7 },
  { category: "Sports", value: 140000, count: 112, growth: -2.4 },
  { category: "Beauty", value: 95000, count: 203, growth: 18.9 },
]

const trafficSourceData = [
  { source: "Organic Search", sessions: 45000, orders: 1850, revenue: 425000, conversionRate: 4.1 },
  { source: "Direct Traffic", sessions: 28000, orders: 1260, revenue: 298000, conversionRate: 4.5 },
  { source: "Social Media", sessions: 22000, orders: 770, revenue: 165000, conversionRate: 3.5 },
  { source: "Email Marketing", sessions: 15000, orders: 825, revenue: 198000, conversionRate: 5.5 },
  { source: "Paid Ads", sessions: 12000, orders: 600, revenue: 145000, conversionRate: 5.0 },
  { source: "Referral", sessions: 8000, orders: 360, revenue: 89000, conversionRate: 4.5 },
]

const customerDemographicsData = [
  { ageGroup: "18-24", percentage: 15, value: 125000 },
  { ageGroup: "25-34", percentage: 35, value: 385000 },
  { ageGroup: "35-44", percentage: 28, value: 312000 },
  { ageGroup: "45-54", percentage: 15, value: 168000 },
  { ageGroup: "55+", percentage: 7, value: 78000 },
]

const deviceData = [
  { device: "Mobile", sessions: 58000, orders: 2890, percentage: 52 },
  { device: "Desktop", sessions: 42000, orders: 2310, percentage: 38 },
  { device: "Tablet", sessions: 12000, orders: 465, percentage: 10 },
]

const topCitiesData = [
  { city: "Addis Ababa", orders: 2450, revenue: 562000 },
  { city: "Dire Dawa", orders: 890, revenue: 198000 },
  { city: "Bahir Dar", orders: 645, revenue: 142000 },
  { city: "Hawassa", orders: 512, revenue: 118000 },
  { city: "Mekelle", orders: 478, revenue: 105000 },
]

const conversionFunnelData = [
  { stage: "Product Views", count: 125000, percentage: 100 },
  { stage: "Add to Cart", count: 18750, percentage: 15 },
  { stage: "Checkout Started", count: 9375, percentage: 7.5 },
  { stage: "Payment Info", count: 6875, percentage: 5.5 },
  { stage: "Order Completed", count: 5625, percentage: 4.5 },
]

const performanceMetricsData = [
  { metric: "Speed", score: 85 },
  { metric: "Quality", score: 92 },
  { metric: "Service", score: 88 },
  { metric: "Pricing", score: 78 },
  { metric: "Selection", score: 82 },
  { metric: "Returns", score: 95 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function EnhancedAnalytics() {
  const [timeRange, setTimeRange] = useState('7d')
  const [comparisonPeriod, setComparisonPeriod] = useState('prev')

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your store performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('24h')}
          >
            24 Hours
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(1268000)}</div>
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(12.5)}
              <span className={`ml-1 ${getTrendColor(12.5)}`}>
                +12.5% vs last period
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ETB 4,523 avg order value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">5,665</div>
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(8.2)}
              <span className={`ml-1 ${getTrendColor(8.2)}`}>
                +8.2% vs last period
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              280 orders pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4.5%</div>
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(0.3)}
              <span className={`ml-1 ${getTrendColor(0.3)}`}>
                +0.3% vs last period
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              5,665 of 125,000 visitors
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">125,000</div>
            <div className="flex items-center text-xs mt-1">
              {getTrendIcon(15.3)}
              <span className={`ml-1 ${getTrendColor(15.3)}`}>
                +15.3% vs last period
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              42,500 unique visitors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue & Orders Trend
                </CardTitle>
                <CardDescription>Daily performance over the selected period</CardDescription>
              </div>
              <Badge className="bg-green-500">+15.3% Growth</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="hsl(var(--chart-1))"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                    name="Revenue (ETB)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Orders"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Category Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Category
            </CardTitle>
            <CardDescription>Top performing product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${((percentage || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="category"
                  >
                    {productCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), 'Revenue']}
                    />} 
                  />
                </RPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Growth Rate
            </CardTitle>
            <CardDescription>Month-over-month comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productCategoryData.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(category.value)}</span>
                      <div className="flex items-center">
                        {getTrendIcon(category.growth)}
                        <span className={`text-xs ml-1 ${getTrendColor(category.growth)}`}>
                          {category.growth > 0 ? '+' : ''}{category.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(category.value / 450000) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic & Customer Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where your customers come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Source</th>
                    <th className="text-right py-2">Sessions</th>
                    <th className="text-right py-2">Conv. Rate</th>
                    <th className="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficSourceData.map((source) => (
                    <tr key={source.source} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-medium">{source.source}</td>
                      <td className="text-right py-3">{source.sessions.toLocaleString()}</td>
                      <td className="text-right py-3">
                        <Badge variant={source.conversionRate > 4.5 ? 'default' : 'secondary'}>
                          {source.conversionRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-3 font-medium">
                        {formatCurrency(source.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Demographics
            </CardTitle>
            <CardDescription>Age distribution of your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerDemographicsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="ageGroup" type="category" className="text-xs" />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value, name) => {
                        if (name === 'percentage') return [`${value}%`, 'Percentage']
                        return [formatCurrency(typeof value === 'number' ? value : 0), 'Revenue']
                      }}
                    />} 
                  />
                  <Bar dataKey="percentage" fill="hsl(var(--chart-1))" name="Percentage (%)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Device Analytics & Top Cities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
            <CardDescription>Orders by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.device} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                      {device.device === 'Desktop' && <Monitor className="h-4 w-4" />}
                      {device.device === 'Tablet' && <Smartphone className="h-4 w-4" />}
                      <span className="text-sm font-medium">{device.device}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{device.orders.toLocaleString()} orders</p>
                      <p className="text-xs text-muted-foreground">{device.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Cities
            </CardTitle>
            <CardDescription>Your best performing locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCitiesData.map((city, index) => (
                <div key={city.city} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{city.city}</p>
                      <p className="text-xs text-muted-foreground">{city.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(city.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>Customer journey from view to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionFunnelData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{stage.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-2">({stage.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-8">
                  <div
                    className="bg-gradient-to-r from-primary to-chart-2 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {stage.percentage >= 15 && `${stage.percentage}%`}
                  </div>
                </div>
                {index < conversionFunnelData.length - 1 && (
                  <div className="text-center text-xs text-muted-foreground mt-1">
                    ↓ {((conversionFunnelData[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Radar */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Scorecard
          </CardTitle>
          <CardDescription>Your store performance across key metrics (0-100 scale)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceMetricsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <ChartTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
