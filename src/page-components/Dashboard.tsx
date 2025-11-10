'use client'

/**
 * Vendor Dashboard Component
 * 
 * TODO: Image upload uses URLs only (upload infrastructure not implemented)
 * The product image upload section currently shows a placeholder UI without
 * actual file upload functionality. Backend infrastructure with file storage
 * (e.g., AWS S3, Cloudinary) and API endpoints are needed to support real
 * image uploads, processing, and storage.
 */

import { useState } from "react"
import { 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  ShoppingCart,
  BarChart3,
  Calendar,
  ArrowDown,
  ArrowUp,
  Minus,
  PieChart,
  Plus,
  Upload,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils"
import heroImage from "@/assets/hero-marketplace.jpg"

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--muted-foreground))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  conversion: {
    label: "Conversion",
    color: "hsl(var(--chart-2))",
  },
};

const mockMetrics = {
  totalSales: 125430,
  totalOrders: 856,
  totalProducts: 24,
  totalViews: 15420,
  recentOrders: [
    { id: "1001", product: "iPhone 15 Pro", amount: 89999, status: "completed", date: "2024-01-10" },
    { id: "1002", product: "Ray-Ban Aviator", amount: 2499, status: "pending", date: "2024-01-09" },
    { id: "1003", product: "Samsung Buds", amount: 3299, status: "shipped", date: "2024-01-09" },
    { id: "1004", product: "Nike Cap", amount: 899, status: "completed", date: "2024-01-08" }
  ],
  topProducts: [
    { name: "iPhone 15 Pro Max", sales: 45, revenue: 4049550, trend: "up" },
    { name: "Ray-Ban Aviator", sales: 32, revenue: 79968, trend: "up" },
    { name: "Samsung Galaxy Buds", sales: 28, revenue: 92372, trend: "down" },
    { name: "Nike Baseball Cap", sales: 24, revenue: 21576, trend: "same" }
  ],
  productPerformance: [
    { name: "iPhone 15 Pro Max", sales: 45, revenue: 4049550, views: 1200, conversion: 3.75 },
    { name: "Ray-Ban Aviator", sales: 32, revenue: 79968, views: 800, conversion: 4.0 },
    { name: "Samsung Galaxy Buds", sales: 28, revenue: 92372, views: 1100, conversion: 2.55 },
    { name: "Nike Baseball Cap", sales: 24, revenue: 21576, views: 600, conversion: 4.0 },
    { name: "Adidas Running Shoes", sales: 18, revenue: 27000, views: 900, conversion: 2.0 },
    { name: "Levi's Jeans", sales: 15, revenue: 7500, views: 500, conversion: 3.0 },
    { name: "MacBook Pro", sales: 12, revenue: 192000, views: 400, conversion: 3.0 },
    { name: "Sony Headphones", sales: 9, revenue: 13500, views: 300, conversion: 3.0 }
  ],
  salesData: [
    { date: "Jan 1", sales: 4000 },
    { date: "Jan 2", sales: 3000 },
    { date: "Jan 3", sales: 2000 },
    { date: "Jan 4", sales: 2780 },
    { date: "Jan 5", sales: 1890 },
    { date: "Jan 6", sales: 2390 },
    { date: "Jan 7", sales: 3490 },
  ]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')
  const [showAddProductForm, setShowAddProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image: ""
  })
  const { toast } = useToast()
  const { user, profile, requestVendorVerification } = useAuth()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'shipped': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />
      case 'same': return <Minus className="h-4 w-4 text-gray-500" />
      default: return null
    }
  }

  const handleAddProduct = () => {
    // Check if vendor is verified
    if (!profile?.isVendor || profile?.vendorStatus !== 'approved') {
      toast({
        title: "Vendor Verification Required",
        description: "Please complete vendor verification before adding products.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send data to a backend
    toast({
      title: "Product Added",
      description: "Your product has been successfully added to the marketplace."
    });
    
    // Reset form
    setNewProduct({
      name: "",
      price: "",
      description: "",
      category: "",
      image: ""
    });
    setShowAddProductForm(false);
  };

  const handleVerifyVendor = () => {
    // In a real app, this would send verification documents to a backend
    if (profile?.tradeLicense && profile?.tinNumber) {
      requestVendorVerification(profile.tradeLicense, profile.tinNumber);
      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted. You'll be notified once approved."
      });
    } else {
      toast({
        title: "Verification Information Required",
        description: "Please provide your Trade License and TIN Number in your profile.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-hero text-white rounded-lg p-8 relative overflow-hidden">
              {/* Background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              {/* Background pattern */}
              <div className="absolute inset-0 bg-grid-white/10 bg-[size:50px_50px] opacity-10" />
              
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
                <p className="text-white/90 text-lg">
                  **Minalesh (ምናለሽ)** — Manage your store, track sales, and grow your business on Ethiopia's leading marketplace
                </p>
              
                {/* Vendor Verification Status */}
                <div className="mt-4">
                  {profile?.isVendor && profile?.vendorStatus === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Verified Vendor
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {profile?.vendorStatus === 'pending' ? 'Verification Pending' : 'Not Verified'}
                      </Badge>
                      {profile?.vendorStatus !== 'pending' && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={handleVerifyVendor}
                          className="ml-2"
                        >
                          Verify Account
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(mockMetrics.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {mockMetrics.totalOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {mockMetrics.totalProducts}
                </div>
                <p className="text-xs text-muted-foreground">
                  2 new this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {mockMetrics.totalViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +15.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              Overview
            </Button>
            <Button 
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant={activeTab === 'products' ? 'default' : 'outline'}
              onClick={() => setActiveTab('products')}
              className={activeTab === 'products' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.product}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.amount)}</p>
                          <Badge 
                            className={`${getStatusColor(order.status)} text-white border-0`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              {product.sales} sales {getTrendIcon(product.trend)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Sales Chart */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockMetrics.salesData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value, name) => [
                              formatCurrency(typeof value === 'number' ? value : 0),
                              name
                            ]}
                          />} 
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          name="Sales"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Product Performance */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Product Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RBarChart data={mockMetrics.productPerformance.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={100} />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" name="Units Sold" />
                      </RBarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Conversion Rates */}
              <Card className="bg-gradient-card shadow-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Conversion Rates by Product
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={mockMetrics.productPerformance.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="conversion"
                          nameKey="name"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {mockMetrics.productPerformance.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value, name) => [`${value}%`, `${name} conversion`]}
                          />} 
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Add Product Form */}
              {showAddProductForm ? (
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Product
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="productName">Product Name</Label>
                          <Input 
                            id="productName" 
                            value={newProduct.name} 
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                            placeholder="Enter product name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productPrice">Price (ETB)</Label>
                          <Input 
                            id="productPrice" 
                            type="number" 
                            value={newProduct.price} 
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
                            placeholder="Enter price"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productCategory">Category</Label>
                          <Input 
                            id="productCategory" 
                            value={newProduct.category} 
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} 
                            placeholder="Enter category"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="productImage">Product Image</Label>
                          {/* TODO: Image upload uses URLs only (upload infrastructure not implemented) */}
                          {/* This is a placeholder UI. Real implementation needs file input, validation, */}
                          {/* upload to storage service (S3, Cloudinary), and saving URLs to database. */}
                          <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">Upload product image</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea 
                        id="productDescription" 
                        value={newProduct.description} 
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} 
                        placeholder="Enter product description"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleAddProduct}
                      >
                        Add Product
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowAddProductForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Management
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
                            <th className="text-right py-2">Conversion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockMetrics.productPerformance.map((product) => (
                            <tr key={product.name} className="border-b">
                              <td className="py-3">{product.name}</td>
                              <td className="text-right py-3">{product.sales}</td>
                              <td className="text-right py-3">{formatCurrency(product.revenue)}</td>
                              <td className="text-right py-3">{product.views}</td>
                              <td className="text-right py-3">{product.conversion}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 justify-center mt-6">
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => setShowAddProductForm(true)}
                      >
                        Add New Product
                      </Button>
                      <Button variant="outline">
                        View All Products
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  )
}