'use client'

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminProductManagement from "@/page-components/AdminProductManagement";
import AdminTaxRatesManagement from "@/page-components/AdminTaxRatesManagement";
import AdminCouponsManagement from "@/page-components/AdminCouponsManagement";
import AdminShippingManagement from "@/page-components/AdminShippingManagement";
import AdminOrdersManagement from "@/page-components/AdminOrdersManagement";
import { 
  Users, 
  Store, 
  LineChart, 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Eye,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  Globe
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--muted-foreground))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--accent))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

const mock = {
  totals: { 
    users: 48210, 
    vendors: 612, 
    orders: 125430, 
    revenue: 25432000,
    activeVendors: 587,
    pendingVerifications: 25,
    totalCategories: 48,
    avgOrderValue: 2028
  },
  weekly: [
    { name: "Mon", sales: 4200000, orders: 120, users: 80, revenue: 4200000 },
    { name: "Tue", sales: 5100000, orders: 140, users: 95, revenue: 5100000 },
    { name: "Wed", sales: 4800000, orders: 132, users: 88, revenue: 4800000 },
    { name: "Thu", sales: 6200000, orders: 158, users: 110, revenue: 6200000 },
    { name: "Fri", sales: 7000000, orders: 176, users: 126, revenue: 7000000 },
    { name: "Sat", sales: 9500000, orders: 210, users: 150, revenue: 9500000 },
    { name: "Sun", sales: 6100000, orders: 160, users: 100, revenue: 6100000 },
  ],
  monthly: Array.from({ length: 12 }, (_, i) => ({ 
    name: `Month ${i + 1}`, 
    sales: 20000000 + Math.round(Math.random()*15000000), 
    orders: 1000 + Math.round(Math.random()*500), 
    users: 600 + Math.round(Math.random()*300),
    revenue: 20000000 + Math.round(Math.random()*15000000)
  })),
  yearly: [
    { name: "2021", sales: 2100000000, orders: 58000, users: 18000, revenue: 2100000000 },
    { name: "2022", sales: 2850000000, orders: 71000, users: 24500, revenue: 2850000000 },
    { name: "2023", sales: 3400000000, orders: 83000, users: 31200, revenue: 3400000000 },
    { name: "2024", sales: 4050000000, orders: 96000, users: 38900, revenue: 4050000000 },
  ],
  topProducts: [
    { name: "iPhone 15 Pro Max", revenue: 4049550000, orders: 450, change: +12.5 },
    { name: "Samsung Galaxy S24", revenue: 799680000, orders: 320, change: +8.2 },
    { name: "MacBook Pro M3", revenue: 923720000, orders: 180, change: -2.1 },
    { name: "AirPods Pro", revenue: 215760000, orders: 680, change: +15.3 },
    { name: "Ray-Ban Aviator", revenue: 187650000, orders: 890, change: +22.1 },
  ],
  vendorPerformance: [
    { name: "Top 10%", count: 61, percentage: 10, revenue: 12800000000 },
    { name: "Top 25%", count: 153, percentage: 15, revenue: 8900000000 },
    { name: "Average", count: 306, percentage: 50, revenue: 2100000000 },
    { name: "Below Avg", count: 92, percentage: 25, revenue: 450000000 },
  ],
  pendingVendors: [
    {
      id: "V001",
      businessName: "Fashion Hub Ethiopia",
      ownerName: "Almaz Tadesse",
      email: "almaz@fashionhub.et",
      tradeLicense: "TL-AA-2024-001234",
      tinNumber: "1234567890",
      submitDate: "2024-12-01",
      category: "Fashion & Apparel",
      status: "pending"
    },
    {
      id: "V002", 
      businessName: "TechStore Ethiopia",
      ownerName: "Dawit Haile",
      email: "dawit@techstore.et",
      tradeLicense: "TL-AA-2024-005678",
      tinNumber: "0987654321",
      submitDate: "2024-12-02",
      category: "Electronics",
      status: "pending"
    },
    {
      id: "V003",
      businessName: "Organic Foods ET",
      ownerName: "Hanan Ahmed", 
      email: "hanan@organicfoods.et",
      tradeLicense: "TL-OR-2024-009876",
      tinNumber: "1122334455",
      submitDate: "2024-12-03",
      category: "Food & Beverages",
      status: "under_review"
    }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [activeTab, setActiveTab] = useState("overview");
  const data = mock[period];
  const { approveVendorVerification } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Admin Dashboard — Minalesh";
  }, []);

  const exportCSV = () => {
    const rows = ["name,sales,orders,users,revenue", ...data.map((d: any) => `${d.name},${d.sales},${d.orders},${d.users},${d.revenue}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApproveVendor = (vendorId: string, businessName: string) => {
    approveVendorVerification(vendorId);
    toast({
      title: "Vendor Approved",
      description: `${businessName} has been approved and can now sell on the platform.`
    });
  };

  const handleRejectVendor = (vendorId: string, businessName: string) => {
    toast({
      title: "Vendor Rejected",
      description: `${businessName} verification has been rejected.`,
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-6 md:py-8">
        <Container>
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="bg-gradient-hero text-white rounded-lg p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-white/90 text-base md:text-lg">
                    Complete marketplace oversight and management
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={period} onValueChange={(value: "weekly" | "monthly" | "yearly") => setPeriod(value)}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={exportCSV} variant="secondary" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6 md:mb-8">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {(mock.totals.users / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +12.5%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {mock.totals.vendors}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +8.2%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {(mock.totals.orders / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +15.3%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {(mock.totals.revenue / 1000000).toFixed(0)}M ETB
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +18.7%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  {mock.totals.activeVendors}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vendors
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-yellow-600">
                  {mock.totals.pendingVerifications}
                </div>
                <div className="text-xs text-muted-foreground">
                  Reviews
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {mock.totals.totalCategories}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  AOV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {mock.totals.avgOrderValue} ETB
                </div>
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <ArrowDown className="h-3 w-3" />
                  -2.1%
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-8 text-xs md:text-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="taxes">Taxes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              formatter={(value, name) => [
                                `${typeof value === 'number' ? value.toLocaleString() : value} ${name === 'Revenue' ? 'ETB' : ''}`,
                                name
                              ]}
                            />} 
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                            name="Revenue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Orders vs Users */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Orders vs Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RBarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="orders" fill="hsl(var(--primary))" name="Orders" />
                          <Bar dataKey="users" fill="hsl(var(--muted-foreground))" name="New Users" />
                        </RBarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mock.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-4 bg-background rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{product.name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{product.orders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm md:text-base">
                            {(product.revenue / 1000000).toFixed(1)}M ETB
                          </p>
                          <div className={`flex items-center gap-1 text-xs ${product.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {Math.abs(product.change)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <AdminOrdersManagement />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <AdminProductManagement />
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              {/* Pending Vendor Verifications */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Pending Vendor Verifications ({mock.pendingVendors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mock.pendingVendors.map((vendor) => (
                      <div key={vendor.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-base">{vendor.businessName}</h3>
                            <p className="text-sm text-muted-foreground">Owner: {vendor.ownerName}</p>
                            <p className="text-sm text-muted-foreground">Email: {vendor.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={vendor.status === 'pending' ? 'secondary' : 'outline'}>
                              {vendor.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Business Details</p>
                            <p>Category: {vendor.category}</p>
                            <p>Trade License: {vendor.tradeLicense}</p>
                            <p>TIN Number: {vendor.tinNumber}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Application Info</p>
                            <p>Submit Date: {vendor.submitDate}</p>
                            <p>Vendor ID: {vendor.id}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApproveVendor(vendor.id, vendor.businessName)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectVendor(vendor.id, vendor.businessName)}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <UserX className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Review Documents
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Performance */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Vendor Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mock.vendorPerformance}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                          {mock.vendorPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value, name, props) => [
                              `${value} vendors (${props.payload?.percentage}%)`,
                              name
                            ]}
                          />} 
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Comparison */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Sales vs Orders Correlation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RLineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              formatter={(value, name) => [
                                `${typeof value === 'number' ? value.toLocaleString() : value} ${name === 'Sales' ? 'ETB' : ''}`,
                                name
                              ]}
                            />} 
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            dot={{ r: 6 }}
                            name="Sales"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="orders" 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeWidth={3} 
                            dot={{ r: 6 }}
                            name="Orders"
                          />
                        </RLineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* User Growth */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>User Acquisition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="hsl(var(--accent))"
                            fill="hsl(var(--accent))"
                            fillOpacity={0.4}
                            name="New Users"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-6">
              <AdminCouponsManagement />
            </TabsContent>

            <TabsContent value="shipping" className="space-y-6">
              <AdminShippingManagement />
            </TabsContent>

            <TabsContent value="taxes" className="space-y-6">
              <AdminTaxRatesManagement />
            </TabsContent>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
