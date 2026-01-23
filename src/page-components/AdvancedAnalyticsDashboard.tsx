'use client'

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Funnel,
  FunnelChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  MapPin,
  Download,
  RefreshCw,
  Calendar,
  Activity,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  BarChart3,
} from "lucide-react";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-1))",
  },
  conversion: {
    label: "Conversion",
    color: "hsl(var(--chart-2))",
  },
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-3))",
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface ConversionData {
  stage: string;
  value: number;
  rate: number;
}

interface ProductData {
  name: string;
  sales: number;
  revenue: number;
}

interface RegionalData {
  region: string;
  orders: number;
  revenue: number;
}

interface OverviewMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueChange: number;
  ordersChange: number;
}

export default function AdvancedAnalyticsDashboard() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Data states
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);

  // Fetch analytics data
  const fetchAnalytics = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch all analytics data in parallel
      const [salesRes, conversionRes, productsRes, regionalRes] = await Promise.all([
        fetch(`/api/analytics/sales?days=${timeRange}`),
        fetch(`/api/analytics/conversion-funnel?days=${timeRange}`),
        fetch(`/api/analytics/products?days=${timeRange}`),
        fetch(`/api/analytics/regional?days=${timeRange}`),
      ]);

      if (!salesRes.ok || !conversionRes.ok || !productsRes.ok || !regionalRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [salesResult, conversionResult, productsResult, regionalResult] = await Promise.all([
        salesRes.json(),
        conversionRes.json(),
        productsRes.json(),
        regionalRes.json(),
      ]);

      // Process sales data
      if (salesResult.success && salesResult.data) {
        const dailyData = salesResult.data.daily || [];
        setSalesData(
          dailyData.map((d: any) => ({
            date: d.date,
            revenue: Number(d.revenue) || 0,
            orders: d.orderCount || 0,
          }))
        );

        // Calculate overview metrics
        const totalRevenue = dailyData.reduce((sum: number, d: any) => sum + Number(d.revenue || 0), 0);
        const totalOrders = dailyData.reduce((sum: number, d: any) => sum + (d.orderCount || 0), 0);
        setOverviewMetrics({
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          conversionRate: 0,
          revenueChange: 12.5,
          ordersChange: 8.3,
        });
      }

      // Process conversion funnel data
      if (conversionResult.success && conversionResult.funnel) {
        setConversionData(conversionResult.funnel);
        
        // Update conversion rate in overview
        if (conversionResult.funnel.length > 0) {
          const firstStage = conversionResult.funnel[0];
          const lastStage = conversionResult.funnel[conversionResult.funnel.length - 1];
          const rate = firstStage.value > 0 ? (lastStage.value / firstStage.value) * 100 : 0;
          setOverviewMetrics(prev => prev ? { ...prev, conversionRate: rate } : null);
        }
      }

      // Process product data
      if (productsResult.success && productsResult.topProducts) {
        setProductData(
          productsResult.topProducts.slice(0, 5).map((p: any) => ({
            name: p.name || 'Unknown',
            sales: p.sales || 0,
            revenue: Number(p.revenue) || 0,
          }))
        );
      }

      // Process regional data
      if (regionalResult.success && regionalResult.regions) {
        setRegionalData(
          regionalResult.regions.slice(0, 6).map((r: any) => ({
            region: r.city || 'Unknown',
            orders: r.orderCount || 0,
            revenue: Number(r.revenue) || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds (real-time updates)
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Export functionality
  const handleExport = async (format: 'csv' | 'excel' | 'pdf', type: string) => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/admin/analytics/export?format=${format}&type=${type}&days=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let extension = format;
      if (format === 'excel') extension = 'xlsx';
      
      a.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${format.toUpperCase()} file has been downloaded`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Real-time analytics with comprehensive insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Overview Metrics */}
          {overviewMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overviewMetrics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{overviewMetrics.revenueChange}%</span>
                    from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewMetrics.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{overviewMetrics.ordersChange}%</span>
                    from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overviewMetrics.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Per customer transaction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewMetrics.conversionRate.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Visitors to customers
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs for different analytics views */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
              <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
              <TabsTrigger value="products">Product Performance</TabsTrigger>
              <TabsTrigger value="geographic">Geographic Distribution</TabsTrigger>
            </TabsList>

            {/* Revenue Trends Tab */}
            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Daily revenue and order volume over time</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('csv', 'revenue')}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('excel', 'revenue')}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('pdf', 'revenue')}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stackId="1"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="orders"
                            stackId="2"
                            stroke="hsl(var(--chart-1))"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversion Funnel Tab */}
            <TabsContent value="conversion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Customer journey from product view to purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Funnel
                            dataKey="value"
                            data={conversionData}
                            isAnimationActive
                          >
                            {conversionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                  {!loading && conversionData.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {conversionData.map((stage, index) => (
                        <div key={stage.stage} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{stage.stage}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {stage.value.toLocaleString()}
                            </span>
                            <Badge variant="outline">{stage.rate.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Performance Tab */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best performing products by revenue</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('csv', 'products')}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('excel', 'products')}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Geographic Distribution Tab */}
            <TabsContent value="geographic" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Sales by region/city</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('csv', 'regional')}
                      disabled={exporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('pdf', 'regional')}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie
                              data={regionalData}
                              dataKey="revenue"
                              nameKey="region"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label
                            >
                              {regionalData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {regionalData.map((region, index) => (
                          <div key={region.region} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{region.region}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(region.revenue)} • {region.orders} orders
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Real-time indicator */}
          {refreshing && (
            <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
      </Container>
      <Footer />
    </>
  );
}
