'use client'

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
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
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  MousePointer,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  MapPin,
  Star,
  Clock
} from "lucide-react";

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
    color: "hsl(var(--primary))",
  },
  traffic: {
    label: "Traffic",
    color: "hsl(var(--chart-2))",
  },
  conversion: {
    label: "Conversion",
    color: "hsl(var(--chart-3))",
  },
};

const salesData = [
  { date: "Jan 1", sales: 45000, orders: 120, users: 850, revenue: 2100000 },
  { date: "Jan 2", sales: 52000, orders: 145, users: 920, revenue: 2450000 },
  { date: "Jan 3", sales: 48000, orders: 132, users: 880, revenue: 2280000 },
  { date: "Jan 4", sales: 61000, orders: 168, users: 1050, revenue: 2920000 },
  { date: "Jan 5", sales: 55000, orders: 155, users: 990, revenue: 2650000 },
  { date: "Jan 6", sales: 67000, orders: 182, users: 1180, revenue: 3240000 },
  { date: "Jan 7", sales: 58000, orders: 161, users: 1020, revenue: 2810000 },
  { date: "Jan 8", sales: 63000, orders: 175, users: 1100, revenue: 3050000 },
  { date: "Jan 9", sales: 71000, orders: 195, users: 1250, revenue: 3420000 },
  { date: "Jan 10", sales: 59000, orders: 164, users: 1040, revenue: 2890000 },
  { date: "Jan 11", sales: 66000, orders: 181, users: 1160, revenue: 3180000 },
  { date: "Jan 12", sales: 74000, orders: 203, users: 1320, revenue: 3580000 },
];

const categoryData = [
  { name: "Electronics", value: 45, sales: 2800000, orders: 890 },
  { name: "Fashion", value: 25, sales: 1560000, orders: 650 },
  { name: "Home & Garden", value: 15, sales: 935000, orders: 380 },
  { name: "Sports", value: 10, sales: 620000, orders: 290 },
  { name: "Books", value: 5, sales: 310000, orders: 180 },
];

const trafficData = [
  { source: "Organic Search", users: 12500, percentage: 42 },
  { source: "Direct", users: 8900, percentage: 30 },
  { source: "Social Media", users: 4200, percentage: 14 },
  { source: "Referral", users: 2800, percentage: 9 },
  { source: "Email", users: 1500, percentage: 5 },
];

const conversionData = [
  { page: "Homepage", visits: 25000, conversions: 1250, rate: 5.0 },
  { page: "Product Pages", visits: 18000, conversions: 1440, rate: 8.0 },
  { page: "Category Pages", visits: 12000, conversions: 600, rate: 5.0 },
  { page: "Search Results", visits: 8000, conversions: 560, rate: 7.0 },
  { page: "Cart", visits: 3000, conversions: 1800, rate: 60.0 },
];

const topProducts = [
  { name: "iPhone 15 Pro Max", sales: 450, revenue: 40495500, change: +12.5 },
  { name: "Samsung Galaxy S24", sales: 320, revenue: 25600000, change: +8.2 },
  { name: "MacBook Pro M3", sales: 180, revenue: 28800000, change: -2.1 },
  { name: "AirPods Pro", sales: 680, revenue: 17000000, change: +15.3 },
  { name: "Ray-Ban Aviator", sales: 890, revenue: 2225000, change: +22.1 },
];

const regionalData = [
  { region: "Addis Ababa", sales: 8500000, orders: 2100, users: 4200 },
  { region: "Oromia", sales: 4200000, orders: 1050, users: 2800 },
  { region: "Amhara", sales: 3100000, orders: 780, users: 2100 },
  { region: "SNNP", sales: 2800000, orders: 650, users: 1900 },
  { region: "Tigray", sales: 1900000, orders: 420, users: 1200 },
  { region: "Other", sales: 2500000, orders: 580, users: 1500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Analytics Dashboard — Minalesh";
  }, []);

  const exportData = () => {
    const data = salesData.map(d => ({
      Date: d.date,
      Sales: d.sales,
      Orders: d.orders,
      Users: d.users,
      Revenue: d.revenue
    }));
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${timeRange}.csv`);
    link.click();
  };

  const totalStats = {
    sales: salesData.reduce((sum, d) => sum + d.sales, 0),
    orders: salesData.reduce((sum, d) => sum + d.orders, 0),
    users: salesData.reduce((sum, d) => sum + d.users, 0),
    revenue: salesData.reduce((sum, d) => sum + d.revenue, 0),
    avgOrderValue: salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.reduce((sum, d) => sum + d.orders, 0),
    conversionRate: (salesData.reduce((sum, d) => sum + d.orders, 0) / salesData.reduce((sum, d) => sum + d.users, 0)) * 100
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
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics Dashboard</h1>
                  <p className="text-white/90 text-base md:text-lg">
                    Comprehensive insights into your marketplace performance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={exportData} variant="secondary" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden md:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6 md:mb-8">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {(totalStats.revenue / 1000000).toFixed(1)}M ETB
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
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {totalStats.orders.toLocaleString()}
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
                  <Users className="h-4 w-4 text-primary" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {(totalStats.users / 1000).toFixed(1)}K
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
                  <Package className="h-4 w-4 text-primary" />
                  AOV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {Math.round(totalStats.avgOrderValue).toLocaleString()} ETB
                </div>
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <ArrowDown className="h-3 w-3" />
                  -2.1%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-primary" />
                  Conv. Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">
                  {totalStats.conversionRate.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +3.7%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Avg Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-primary">4.8</div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  +0.2
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Sales Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Revenue by Category */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Revenue by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Regional Performance */}
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Regional Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="region" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales (ETB)" />
                        <Bar dataKey="orders" fill="hsl(var(--muted-foreground))" name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales & Orders */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Sales & Orders Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2} 
                            name="Sales (ETB)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="orders" 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeWidth={2} 
                            name="Orders"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{(product.revenue / 1000000).toFixed(1)}M ETB</p>
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
              </div>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Traffic Sources */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Traffic Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trafficData.map((source, index) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{source.source}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{source.users.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{source.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MousePointer className="h-5 w-5" />
                      Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {conversionData.map((page) => (
                        <div key={page.page} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{page.page}</span>
                            <span className="text-muted-foreground">{page.rate}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(page.rate, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{page.visits.toLocaleString()} visits</span>
                            <span>{page.conversions.toLocaleString()} conversions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle>Product Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={100} />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}