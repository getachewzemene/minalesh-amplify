'use client'

/**
 * Advanced Vendor Dashboard Component
 * 
 * Provides professional e-commerce features including:
 * - Bulk operations (product upload, editing, pricing)
 * - Advanced inventory management with forecasting
 * - Performance insights and analytics
 * - Marketing tools and campaign management
 * - Enhanced order management
 * - Customer communication tools
 * - Financial tracking and reporting
 */

import { useState, useEffect, useCallback } from "react"
import { 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MessageSquare,
  Upload,
  Download,
  FileSpreadsheet,
  Target,
  BarChart3,
  Calendar,
  Bell,
  Filter,
  Search,
  Mail,
  Star,
  AlertTriangle,
  Calculator,
  Megaphone,
  ShoppingBag,
  Clock,
  TrendingDown,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { LoadingState, CardLoadingSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { MobileNav } from "@/components/ui/mobile-nav"
import { useIsMobile } from "@/hooks/use-mobile"
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
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface InventoryForecast {
  productId: string
  productName: string
  currentStock: number
  dailyAverage: number
  daysUntilStockout: number
  recommendedReorder: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface CustomerInsight {
  source: string
  sessions: number
  conversions: number
  conversionRate: number
  revenue: number
}

interface ProductComparison {
  productId: string
  name: string
  sales: number
  revenue: number
  views: number
  conversionRate: number
  avgRating: number
  reviewCount: number
}

interface MarketingCampaign {
  id: string
  name: string
  type: 'discount' | 'promotion' | 'featured'
  status: 'active' | 'scheduled' | 'ended'
  startDate: string
  endDate: string
  productsCount: number
  sales: number
  revenue: number
}

const chartConfig = {
  forecast: {
    label: "Forecast",
    color: "hsl(var(--chart-1))",
  },
  actual: {
    label: "Actual",
    color: "hsl(var(--chart-2))",
  },
}

const vendorNavItems = [
  { value: "bulk-operations", label: "Bulk Operations", icon: <Upload className="h-4 w-4" /> },
  { value: "inventory-forecast", label: "Inventory Forecast", icon: <Package className="h-4 w-4" /> },
  { value: "performance", label: "Performance Insights", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
  { value: "communication", label: "Communication", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "financial", label: "Financial Tools", icon: <Calculator className="h-4 w-4" /> },
];

export default function VendorAdvancedDashboard() {
  const [activeTab, setActiveTab] = useState('bulk-operations')
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [inventoryForecasts, setInventoryForecasts] = useState<InventoryForecast[]>([])
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([])
  const [productComparisons, setProductComparisons] = useState<ProductComparison[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const { toast } = useToast()
  const { profile } = useAuth()
  const isMobile = useIsMobile()

  // Mock data for inventory forecasting
  const mockInventoryForecasts: InventoryForecast[] = [
    {
      productId: '1',
      productName: 'iPhone 15 Pro Max',
      currentStock: 15,
      dailyAverage: 2.5,
      daysUntilStockout: 6,
      recommendedReorder: 50,
      trend: 'increasing'
    },
    {
      productId: '2',
      productName: 'Samsung Galaxy Buds',
      currentStock: 45,
      dailyAverage: 1.2,
      daysUntilStockout: 37,
      recommendedReorder: 30,
      trend: 'stable'
    },
    {
      productId: '3',
      productName: 'Ray-Ban Aviator',
      currentStock: 8,
      dailyAverage: 1.8,
      daysUntilStockout: 4,
      recommendedReorder: 40,
      trend: 'increasing'
    }
  ]

  // Mock data for customer insights
  const mockCustomerInsights: CustomerInsight[] = [
    { source: 'Organic Search', sessions: 1250, conversions: 85, conversionRate: 6.8, revenue: 125000 },
    { source: 'Direct', sessions: 820, conversions: 62, conversionRate: 7.6, revenue: 98000 },
    { source: 'Social Media', sessions: 650, conversions: 28, conversionRate: 4.3, revenue: 45000 },
    { source: 'Referral', sessions: 420, conversions: 31, conversionRate: 7.4, revenue: 52000 }
  ]

  // Mock data for product comparison
  const mockProductComparisons: ProductComparison[] = [
    {
      productId: '1',
      name: 'iPhone 15 Pro Max',
      sales: 45,
      revenue: 4049550,
      views: 1200,
      conversionRate: 3.75,
      avgRating: 4.8,
      reviewCount: 23
    },
    {
      productId: '2',
      name: 'Ray-Ban Aviator',
      sales: 32,
      revenue: 79968,
      views: 800,
      conversionRate: 4.0,
      avgRating: 4.5,
      reviewCount: 18
    },
    {
      productId: '3',
      name: 'Samsung Galaxy Buds',
      sales: 28,
      revenue: 92372,
      views: 1100,
      conversionRate: 2.55,
      avgRating: 4.6,
      reviewCount: 15
    }
  ]

  // Mock data for marketing campaigns
  const mockCampaigns: MarketingCampaign[] = [
    {
      id: '1',
      name: 'Holiday Sale 2024',
      type: 'discount',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      productsCount: 12,
      sales: 156,
      revenue: 245000
    },
    {
      id: '2',
      name: 'New Arrivals Promotion',
      type: 'featured',
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      productsCount: 8,
      sales: 89,
      revenue: 156000
    },
    {
      id: '3',
      name: 'Flash Sale Weekend',
      type: 'promotion',
      status: 'scheduled',
      startDate: '2024-02-01',
      endDate: '2024-02-03',
      productsCount: 5,
      sales: 0,
      revenue: 0
    }
  ]

  useEffect(() => {
    // Load mock data
    setInventoryForecasts(mockInventoryForecasts)
    setCustomerInsights(mockCustomerInsights)
    setProductComparisons(mockProductComparisons)
    setCampaigns(mockCampaigns)
  }, [])

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive"
      })
      return
    }

    setUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // In a real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "Products imported successfully",
        description: "Your products have been uploaded and will be processed shortly."
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleExportProducts = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would call an API endpoint to generate and download CSV
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Export started",
        description: "Your product data is being exported. Download will start shortly."
      })
    } catch (error) {
      console.error('Error exporting products:', error)
      toast({
        title: "Export failed",
        description: "Failed to export products. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'scheduled':
        return 'bg-blue-500'
      case 'ended':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Advanced Vendor Tools</h2>
        <p className="text-muted-foreground">
          Professional e-commerce features to scale and optimize your business
        </p>
      </div>

      {/* Navigation - Mobile: Collapsible sidebar, Desktop: Button row */}
      {isMobile ? (
        <MobileNav
          items={vendorNavItems}
          activeItem={activeTab}
          onItemChange={setActiveTab}
          title="Vendor Tools"
          className="mb-6"
        />
      ) : (
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button 
            variant={activeTab === 'bulk-operations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bulk-operations')}
            className={activeTab === 'bulk-operations' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Operations
          </Button>
          <Button 
            variant={activeTab === 'inventory-forecast' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventory-forecast')}
            className={activeTab === 'inventory-forecast' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <Package className="h-4 w-4 mr-2" />
            Inventory Forecast
          </Button>
          <Button 
            variant={activeTab === 'performance' ? 'default' : 'outline'}
            onClick={() => setActiveTab('performance')}
            className={activeTab === 'performance' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Insights
          </Button>
          <Button 
            variant={activeTab === 'marketing' ? 'default' : 'outline'}
            onClick={() => setActiveTab('marketing')}
            className={activeTab === 'marketing' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <Megaphone className="h-4 w-4 mr-2" />
            Marketing
          </Button>
          <Button 
            variant={activeTab === 'communication' ? 'default' : 'outline'}
            onClick={() => setActiveTab('communication')}
            className={activeTab === 'communication' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Communication
          </Button>
          <Button 
            variant={activeTab === 'financial' ? 'default' : 'outline'}
            onClick={() => setActiveTab('financial')}
            className={activeTab === 'financial' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Financial Tools
          </Button>
        </div>
      )}

      {/* Bulk Operations Tab */}
      {activeTab === 'bulk-operations' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Product Upload
              </CardTitle>
              <CardDescription>
                Upload multiple products at once using CSV or Excel files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="bulk-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleBulkUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
                <label
                  htmlFor="bulk-upload"
                  className={`cursor-pointer block ${uploadingFile ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {uploadingFile ? (
                    <>
                      <div className="mx-auto h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm text-gray-600">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload CSV or Excel file</p>
                      <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                    </>
                  )}
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" className="flex-1">
                  View Upload History
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Bulk Export & Edit
              </CardTitle>
              <CardDescription>
                Export your products for bulk editing and re-import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleExportProducts}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Products (CSV)
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected Products
                </Button>
                <Button className="w-full" variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Inventory Report
                </Button>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Quick Actions:</p>
                <div className="space-y-2">
                  <Button className="w-full" variant="secondary" size="sm">
                    Bulk Price Update
                  </Button>
                  <Button className="w-full" variant="secondary" size="sm">
                    Bulk Stock Adjustment
                  </Button>
                  <Button className="w-full" variant="secondary" size="sm">
                    Bulk Category Change
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Forecast Tab */}
      {activeTab === 'inventory-forecast' && (
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Forecasting
              </CardTitle>
              <CardDescription>
                AI-powered predictions based on sales trends and seasonality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryForecasts.map((forecast) => (
                  <div key={forecast.productId} className="border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {forecast.productName}
                          {getTrendIcon(forecast.trend)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Current Stock: {forecast.currentStock} units
                        </p>
                      </div>
                      {forecast.daysUntilStockout < 7 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock Alert
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Daily Average Sales</p>
                        <p className="font-semibold">{forecast.dailyAverage} units/day</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Until Stockout</p>
                        <p className={`font-semibold ${forecast.daysUntilStockout < 7 ? 'text-red-500' : ''}`}>
                          {forecast.daysUntilStockout} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended Reorder</p>
                        <p className="font-semibold text-green-600">{forecast.recommendedReorder} units</p>
                      </div>
                      <div>
                        <Button size="sm" className="w-full">
                          Create Purchase Order
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Inventory Turnover Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Average Turnover Rate</p>
                  <p className="text-2xl font-bold text-primary">6.2x</p>
                  <p className="text-xs text-green-600">+12% vs last month</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Aging Stock (&gt;90 days)</p>
                  <p className="text-2xl font-bold text-yellow-600">3 items</p>
                  <p className="text-xs text-muted-foreground">Worth ETB 45,000</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Optimal Stock Level</p>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                  <p className="text-xs text-green-600">Well balanced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Insights Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Behavior Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Traffic Source</th>
                      <th className="text-right py-2">Sessions</th>
                      <th className="text-right py-2">Conversions</th>
                      <th className="text-right py-2">Conv. Rate</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInsights.map((insight) => (
                      <tr key={insight.source} className="border-b">
                        <td className="py-3">{insight.source}</td>
                        <td className="text-right py-3">{insight.sessions.toLocaleString()}</td>
                        <td className="text-right py-3">{insight.conversions}</td>
                        <td className="text-right py-3">
                          <Badge variant={insight.conversionRate > 6 ? 'default' : 'secondary'}>
                            {insight.conversionRate}%
                          </Badge>
                        </td>
                        <td className="text-right py-3 font-medium">{formatCurrency(insight.revenue)}</td>
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
                <Target className="h-5 w-5" />
                Product Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Sales</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Conv. Rate</th>
                      <th className="text-right py-2">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productComparisons.map((product) => (
                      <tr key={product.productId} className="border-b hover:bg-muted/50">
                        <td className="py-3">{product.name}</td>
                        <td className="text-right py-3">{product.sales}</td>
                        <td className="text-right py-3 font-medium">{formatCurrency(product.revenue)}</td>
                        <td className="text-right py-3">{product.views}</td>
                        <td className="text-right py-3">{product.conversionRate}%</td>
                        <td className="text-right py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{product.avgRating}</span>
                            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marketing Tab */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Marketing Campaigns
              </CardTitle>
              <CardDescription>
                Manage promotional campaigns and track their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Create New Campaign
                </Button>
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${getCampaignStatusColor(campaign.status)} text-white`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Products</p>
                        <p className="font-semibold">{campaign.productsCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="font-semibold">{campaign.sales}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{formatCurrency(campaign.revenue)}</p>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="w-full">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scheduled Promotions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">Weekend Flash Sale</p>
                      <p className="text-sm text-muted-foreground">Starts in 3 days</p>
                    </div>
                    <Badge className="bg-blue-500">Scheduled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">New Year Clearance</p>
                      <p className="text-sm text-muted-foreground">Starts in 8 days</p>
                    </div>
                    <Badge className="bg-blue-500">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Featured Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Featured products get 3x more visibility
                  </p>
                  <Button className="w-full" variant="outline">
                    Manage Featured Products
                  </Button>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">5</p>
                      <p className="text-xs text-muted-foreground">Currently Featured</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-green-600">340%</p>
                      <p className="text-xs text-muted-foreground">Avg. View Increase</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === 'communication' && (
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Customer Messages
              </CardTitle>
              <CardDescription>
                Communicate with customers and manage inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Search messages..." className="flex-1" />
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-background hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          AB
                        </div>
                        <div>
                          <p className="font-semibold">Abebe Bekele</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <Badge>New</Badge>
                    </div>
                    <p className="text-sm">Is the iPhone 15 Pro Max available in blue color?</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-background hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                          MT
                        </div>
                        <div>
                          <p className="font-semibold">Marta Tadesse</p>
                          <p className="text-sm text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm">Can you ship to Bahir Dar?</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Quick Response Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    Shipping Information
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Product Availability
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Return Policy
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    Custom Shipping Options
                  </Button>
                  <Button className="w-full" variant="secondary">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Product Q&A Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Unanswered Questions</p>
                      <Badge variant="destructive">12</Badge>
                    </div>
                    <Button size="sm" className="w-full">View & Answer</Button>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Pending Reviews</p>
                      <Badge className="bg-yellow-500">8</Badge>
                    </div>
                    <Button size="sm" className="w-full" variant="outline">View Reviews</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Financial Tools Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Profit Margin Calculator
              </CardTitle>
              <CardDescription>
                Calculate and optimize your product margins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cost-price">Cost Price (ETB)</Label>
                    <Input id="cost-price" type="number" placeholder="Enter cost price" />
                  </div>
                  <div>
                    <Label htmlFor="selling-price">Selling Price (ETB)</Label>
                    <Input id="selling-price" type="number" placeholder="Enter selling price" />
                  </div>
                  <div>
                    <Label htmlFor="additional-costs">Additional Costs (ETB)</Label>
                    <Input id="additional-costs" type="number" placeholder="Shipping, tax, etc." />
                  </div>
                  <Button className="w-full">Calculate Margin</Button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Gross Margin</p>
                    <p className="text-3xl font-bold text-green-600">--</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                    <p className="text-3xl font-bold text-primary">--</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Margin %</p>
                    <p className="text-3xl font-bold">--%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Expense Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full">
                    Add Expense
                  </Button>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">This Month's Expenses</p>
                        <p className="text-sm text-muted-foreground">18 transactions</p>
                      </div>
                      <p className="font-bold text-red-600">{formatCurrency(45600)}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">Shipping Costs</p>
                        <p className="text-sm text-muted-foreground">12 transactions</p>
                      </div>
                      <p className="font-bold">{formatCurrency(12300)}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Spend</p>
                        <p className="text-sm text-muted-foreground">3 transactions</p>
                      </div>
                      <p className="font-bold">{formatCurrency(18500)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Tax Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total VAT Collected (15%)</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(18750)}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download VAT Report
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Income Statement
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Transaction History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
