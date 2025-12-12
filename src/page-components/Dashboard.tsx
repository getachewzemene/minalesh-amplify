'use client'

/**
 * Vendor Dashboard Component
 * 
 * Includes product image upload functionality using the /api/upload endpoint.
 * Images are currently stored in public/uploads directory. For production,
 * consider migrating to cloud storage (AWS S3, Cloudinary, etc.) for better
 * scalability and CDN support.
 */

import { useState, useEffect, useCallback } from "react"
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
  AlertCircle,
  FileText,
  Receipt
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
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingState, CardLoadingSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
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

// TypeScript interfaces for API responses
interface VendorStatement {
  id: string;
  statementNumber: string;
  periodStart: string;
  periodEnd: string;
  totalSales: string | number;
  commissionAmount: string | number;
  payoutAmount: string | number;
  createdAt: string;
  payout?: {
    status: string;
    paidAt?: string;
  } | null;
}

interface CommissionLedgerEntry {
  id: string;
  orderId: string;
  saleAmount: string | number;
  commissionRate: string | number;
  commissionAmount: string | number;
  vendorPayout: string | number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    price: "",
    salePrice: "",
    description: "",
    shortDescription: "",
    category: "",
    sku: "",
    stockQuantity: "",
    lowStockThreshold: "5",
    weight: "",
    image: "",
    features: [] as string[],
    isDigital: false,
    isFeatured: false
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [statements, setStatements] = useState<VendorStatement[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<CommissionLedgerEntry[]>([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [loadingLedger, setLoadingLedger] = useState(false)
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

  const handleAddProduct = async () => {
    // Check if vendor is verified
    if (!profile?.isVendor || profile?.vendorStatus !== 'approved') {
      toast({
        title: "Vendor Verification Required",
        description: "Please complete vendor verification before adding products.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.stockQuantity || !newProduct.description) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      });
      return;
    }
    
    if (!newProduct.image) {
      toast({
        title: "Image Required",
        description: "Please upload at least one product image.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Call the API to create the product
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          brand: newProduct.brand || undefined,
          price: parseFloat(newProduct.price),
          salePrice: newProduct.salePrice ? parseFloat(newProduct.salePrice) : undefined,
          description: newProduct.description,
          shortDescription: newProduct.shortDescription || undefined,
          categoryName: newProduct.category,
          sku: newProduct.sku || undefined,
          stockQuantity: parseInt(newProduct.stockQuantity),
          lowStockThreshold: parseInt(newProduct.lowStockThreshold) || 5,
          weight: newProduct.weight ? parseFloat(newProduct.weight) : undefined,
          images: [newProduct.image],
          isDigital: newProduct.isDigital,
          isFeatured: newProduct.isFeatured,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      
      toast({
        title: "Product Added",
        description: "Your product has been successfully added to the marketplace."
      });
      
      // Reset form
      setNewProduct({
        name: "",
        brand: "",
        price: "",
        salePrice: "",
        description: "",
        shortDescription: "",
        category: "",
        sku: "",
        stockQuantity: "",
        lowStockThreshold: "5",
        weight: "",
        image: "",
        features: [],
        isDigital: false,
        isFeatured: false
      });
      setImagePreview(null);
      setShowAddProductForm(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setNewProduct({ ...newProduct, image: data.url });
        toast({
          title: "Image uploaded",
          description: "Your product image has been uploaded successfully."
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch vendor statements
  const fetchStatements = useCallback(async () => {
    if (!profile?.isVendor) return;
    
    setLoadingStatements(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/vendors/statements?limit=20', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatements(data.statements || []);
      } else {
        throw new Error('Failed to fetch statements');
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      toast({
        title: "Error",
        description: "Failed to load statements. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingStatements(false);
    }
  }, [profile?.isVendor, toast]);

  // Fetch commission ledger
  const fetchLedger = useCallback(async () => {
    if (!profile?.isVendor) return;
    
    setLoadingLedger(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/vendors/ledger?limit=50', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLedgerEntries(data.entries || []);
      } else {
        throw new Error('Failed to fetch ledger');
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast({
        title: "Error",
        description: "Failed to load commission ledger. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingLedger(false);
    }
  }, [profile?.isVendor, toast]);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'statements' && statements.length === 0) {
      fetchStatements();
    }
    if (activeTab === 'ledger' && ledgerEntries.length === 0) {
      fetchLedger();
    }
  }, [activeTab, statements.length, ledgerEntries.length, fetchStatements, fetchLedger]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8">
          <Container>
            <LoadingState message="Loading dashboard..." />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardLoadingSkeleton count={4} />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8">
          <Container>
            <ErrorState 
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
                setTimeout(() => setLoading(false), 1000);
              }}
            />
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
          <div className="flex gap-2 mb-6 flex-wrap">
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
            <Button 
              variant={activeTab === 'statements' ? 'default' : 'outline'}
              onClick={() => setActiveTab('statements')}
              className={activeTab === 'statements' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              <FileText className="h-4 w-4 mr-2" />
              Statements
            </Button>
            <Button 
              variant={activeTab === 'ledger' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ledger')}
              className={activeTab === 'ledger' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Commission Ledger
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
                          <Label htmlFor="productName">Product Name *</Label>
                          <Input 
                            id="productName" 
                            value={newProduct.name} 
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                            placeholder="Enter product name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productBrand">Brand</Label>
                          <Input 
                            id="productBrand" 
                            value={newProduct.brand} 
                            onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} 
                            placeholder="Enter brand name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productPrice">Price (ETB) *</Label>
                          <Input 
                            id="productPrice" 
                            type="number" 
                            step="0.01"
                            value={newProduct.price} 
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
                            placeholder="Enter price"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productSalePrice">Sale Price (ETB)</Label>
                          <Input 
                            id="productSalePrice" 
                            type="number" 
                            step="0.01"
                            value={newProduct.salePrice} 
                            onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})} 
                            placeholder="Enter sale price (optional)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productCategory">Category *</Label>
                          <Input 
                            id="productCategory" 
                            value={newProduct.category} 
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} 
                            placeholder="Enter category"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productSku">SKU</Label>
                          <Input 
                            id="productSku" 
                            value={newProduct.sku} 
                            onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} 
                            placeholder="Enter SKU (optional)"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="productStockQuantity">Stock Quantity *</Label>
                          <Input 
                            id="productStockQuantity" 
                            type="number" 
                            value={newProduct.stockQuantity} 
                            onChange={(e) => setNewProduct({...newProduct, stockQuantity: e.target.value})} 
                            placeholder="Enter stock quantity"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productLowStockThreshold">Low Stock Alert Threshold</Label>
                          <Input 
                            id="productLowStockThreshold" 
                            type="number" 
                            value={newProduct.lowStockThreshold} 
                            onChange={(e) => setNewProduct({...newProduct, lowStockThreshold: e.target.value})} 
                            placeholder="Alert when stock is below (default: 5)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productWeight">Weight (kg)</Label>
                          <Input 
                            id="productWeight" 
                            type="number" 
                            step="0.01"
                            value={newProduct.weight} 
                            onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})} 
                            placeholder="Enter product weight"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isDigital"
                              checked={newProduct.isDigital}
                              onChange={(e) => setNewProduct({...newProduct, isDigital: e.target.checked})}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="isDigital" className="cursor-pointer">Digital Product</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isFeatured"
                              checked={newProduct.isFeatured}
                              onChange={(e) => setNewProduct({...newProduct, isFeatured: e.target.checked})}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="isFeatured" className="cursor-pointer">Featured Product</Label>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="productImage">Product Image *</Label>
                          <input
                            type="file"
                            id="productImage"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="productImage"
                            className={`border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer hover:border-primary transition-colors ${
                              uploadingImage ? 'opacity-50 cursor-wait' : ''
                            }`}
                          >
                            {imagePreview ? (
                              <div className="space-y-2">
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="mx-auto h-32 w-32 object-cover rounded"
                                />
                                <p className="text-sm text-gray-600">Click to change image</p>
                              </div>
                            ) : uploadingImage ? (
                              <>
                                <div className="mx-auto h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-2 text-sm text-gray-600">Uploading...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">Click to upload product image</p>
                                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="productShortDescription">Short Description</Label>
                        <Textarea 
                          id="productShortDescription" 
                          value={newProduct.shortDescription} 
                          onChange={(e) => setNewProduct({...newProduct, shortDescription: e.target.value})} 
                          placeholder="Brief product summary (max 160 characters)"
                          rows={2}
                          maxLength={160}
                        />
                      </div>
                      <div>
                        <Label htmlFor="productDescription">Full Description *</Label>
                        <Textarea 
                          id="productDescription" 
                          value={newProduct.description} 
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} 
                          placeholder="Enter detailed product description"
                          rows={4}
                          required
                        />
                      </div>
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
                        onClick={() => {
                          setShowAddProductForm(false);
                          setNewProduct({
                            name: "",
                            brand: "",
                            price: "",
                            salePrice: "",
                            description: "",
                            shortDescription: "",
                            category: "",
                            sku: "",
                            stockQuantity: "",
                            lowStockThreshold: "5",
                            weight: "",
                            image: "",
                            features: [],
                            isDigital: false,
                            isFeatured: false
                          });
                          setImagePreview(null);
                        }}
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

          {activeTab === 'statements' && (
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Vendor Statements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStatements ? (
                    <LoadingState message="Loading statements..." />
                  ) : statements.length === 0 ? (
                    <EmptyState 
                      icon={FileText}
                      title="No statements available"
                      description="Your vendor statements will appear here once payouts are processed."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Statement #</th>
                            <th className="text-left py-2">Period</th>
                            <th className="text-right py-2">Total Sales</th>
                            <th className="text-right py-2">Commission</th>
                            <th className="text-right py-2">Payout Amount</th>
                            <th className="text-center py-2">Status</th>
                            <th className="text-center py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statements.map((statement: VendorStatement) => (
                            <tr key={statement.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 font-mono text-sm">{statement.statementNumber}</td>
                              <td className="py-3 text-sm">
                                {new Date(statement.periodStart).toLocaleDateString()} - {new Date(statement.periodEnd).toLocaleDateString()}
                              </td>
                              <td className="text-right py-3 font-medium">
                                {formatCurrency(Number(statement.totalSales))}
                              </td>
                              <td className="text-right py-3 text-red-600">
                                -{formatCurrency(Number(statement.commissionAmount))}
                              </td>
                              <td className="text-right py-3 font-bold text-green-600">
                                {formatCurrency(Number(statement.payoutAmount))}
                              </td>
                              <td className="text-center py-3">
                                <Badge 
                                  className={statement.payout?.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}
                                >
                                  {statement.payout?.status === 'paid' ? 'Paid' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="text-center py-3 text-sm text-muted-foreground">
                                {new Date(statement.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Commission Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLedger ? (
                    <LoadingState message="Loading commission ledger..." />
                  ) : ledgerEntries.length === 0 ? (
                    <EmptyState 
                      icon={Receipt}
                      title="No commission records"
                      description="Your commission transactions will appear here when orders are completed."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Order ID</th>
                            <th className="text-right py-2">Sale Amount</th>
                            <th className="text-right py-2">Commission Rate</th>
                            <th className="text-right py-2">Commission</th>
                            <th className="text-right py-2">Your Payout</th>
                            <th className="text-center py-2">Status</th>
                            <th className="text-center py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerEntries.map((entry: CommissionLedgerEntry) => (
                            <tr key={entry.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 font-mono text-sm">{entry.orderId ? entry.orderId.slice(0, 8) + '...' : 'N/A'}</td>
                              <td className="text-right py-3">
                                {formatCurrency(Number(entry.saleAmount))}
                              </td>
                              <td className="text-right py-3">
                                {(Number(entry.commissionRate) * 100).toFixed(2)}%
                              </td>
                              <td className="text-right py-3 text-red-600">
                                -{formatCurrency(Number(entry.commissionAmount))}
                              </td>
                              <td className="text-right py-3 font-bold text-green-600">
                                {formatCurrency(Number(entry.vendorPayout))}
                              </td>
                              <td className="text-center py-3">
                                <Badge 
                                  className={
                                    entry.status === 'paid' ? 'bg-green-500' : 
                                    entry.status === 'recorded' ? 'bg-blue-500' : 
                                    'bg-yellow-500'
                                  }
                                >
                                  {entry.status}
                                </Badge>
                              </td>
                              <td className="text-center py-3 text-sm text-muted-foreground">
                                {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Container>
      </main>

      <Footer />
      </div>
    </ErrorBoundary>
  )
}