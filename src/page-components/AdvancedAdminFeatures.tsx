'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Package,
  DollarSign,
  Activity,
  RefreshCw,
  Download,
  Settings,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveStats {
  timestamp: string;
  stats: {
    today: {
      orders: number;
      revenue: number;
      newUsers: number;
      newVendors: number;
    };
    last24Hours: {
      activeUsers: number;
    };
    pending: {
      orders: number;
      vendorVerifications: number;
    };
    alerts: {
      lowStockProducts: number;
    };
    growth: {
      ordersWeekly: string;
    };
  };
  recentActivity: any[];
}

interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

export default function AdvancedAdminFeatures() {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchLiveStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/live-stats');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to access admin features.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error Loading Stats",
            description: "Failed to load dashboard statistics. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
      const data = await response.json();
      if (data.success) {
        setLiveStats(data);
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
      toast({
        title: "Network Error",
        description: "Could not connect to server. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return; // Already handled in fetchLiveStats
        }
        toast({
          title: "Error Loading Notifications",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive",
        });
        return;
      }
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLiveStats(), fetchNotifications()]);
      setLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(() => {
      fetchLiveStats();
      fetchNotifications();
    }, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const exportReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/admin/reports?type=${reportType}&format=csv`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast({
          title: "Export Failed",
          description: errorData.error || `Failed to export ${reportType} report. Please try again.`,
          variant: "destructive",
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Report Downloaded",
        description: `${reportType} report has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'alert':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Auto-Refresh Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time insights and powerful management tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchLiveStats();
              fetchNotifications();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Live Stats Dashboard */}
      {liveStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Today's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Number(liveStats.stats.today.revenue).toLocaleString()} ETB
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {liveStats.stats.today.orders} orders today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                New Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {liveStats.stats.today.newUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Joined today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {liveStats.stats.last24Hours.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                Weekly Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {liveStats.stats.growth.ordersWeekly}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Order growth
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Zap className="h-4 w-4 mr-2" />
            Quick Tools
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts & Notifications
              </CardTitle>
              <CardDescription>
                Important events and alerts that require attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>All clear! No notifications at this time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant={getBadgeVariant(notification.type)}>
                            {notification.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            View Details →
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Platform Activity
              </CardTitle>
              <CardDescription>
                Latest orders and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveStats && liveStats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {liveStats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">
                            Order {activity.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user.name} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Number(activity.amount).toLocaleString()} ETB</p>
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Reports
              </CardTitle>
              <CardDescription>
                Export comprehensive reports in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['sales', 'inventory', 'customers', 'vendors', 'financial'].map((reportType) => (
                  <Card key={reportType}>
                    <CardHeader>
                      <CardTitle className="text-base capitalize">{reportType} Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => exportReport(reportType)}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Site Configuration
                </CardTitle>
                <CardDescription>
                  Manage global site settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Segments
                </CardTitle>
                <CardDescription>
                  View and manage customer groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View CRM
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pending Actions Summary */}
      {liveStats && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-5 w-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{liveStats.stats.pending.orders}</p>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{liveStats.stats.pending.vendorVerifications}</p>
                  <p className="text-sm text-muted-foreground">Vendor Verifications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{liveStats.stats.alerts.lowStockProducts}</p>
                  <p className="text-sm text-muted-foreground">Low Stock Products</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
