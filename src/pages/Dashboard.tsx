import { useState } from "react"
import { 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  ShoppingCart,
  BarChart3,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"

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
    { name: "iPhone 15 Pro Max", sales: 45, revenue: 4049550 },
    { name: "Ray-Ban Aviator", sales: 32, revenue: 79968 },
    { name: "Samsung Galaxy Buds", sales: 28, revenue: 92372 },
    { name: "Nike Baseball Cap", sales: 24, revenue: 21576 }
  ]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'shipped': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-hero text-white rounded-lg p-8">
              <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
              <p className="text-white/90 text-lg">
                **Minalesh (ምናለሽ)** — Manage your store, track sales, and grow your business on Ethiopia's leading marketplace
              </p>
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
                  {mockMetrics.totalSales.toLocaleString()} ETB
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
                          <p className="font-medium">{order.amount.toLocaleString()} ETB</p>
                          <Badge 
                            className={`${getStatusColor(order.status)} text-white border-0`}
                            variant="secondary"
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
                            <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">{product.revenue.toLocaleString()} ETB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground mb-6">
                    Get detailed insights into your sales performance, customer behavior, and market trends.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'products' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Manage Your Products</h3>
                  <p className="text-muted-foreground mb-6">
                    Add new products, update existing listings, manage inventory, and optimize your catalog.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button className="bg-primary hover:bg-primary/90">
                      Add New Product
                    </Button>
                    <Button variant="outline">
                      View All Products
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  )
}