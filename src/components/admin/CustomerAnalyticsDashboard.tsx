'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  TrendingUp,
  Repeat,
  DollarSign,
  Calendar,
  Target,
  UserCheck,
  BarChart3
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const chartConfig = {
  customers: {
    label: "Customers",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
}

// Mock data - in production, fetch from API
const cohortData = [
  { month: "Jan", newCustomers: 1250, returning: 450, revenue: 8500000 },
  { month: "Feb", newCustomers: 1420, returning: 680, revenue: 10200000 },
  { month: "Mar", newCustomers: 1680, returning: 890, revenue: 12800000 },
  { month: "Apr", newCustomers: 1590, returning: 1120, revenue: 14500000 },
  { month: "May", newCustomers: 1820, returning: 1450, revenue: 16900000 },
  { month: "Jun", newCustomers: 2100, returning: 1780, revenue: 19200000 },
]

const customerSegments = [
  { name: "VIP (>5 orders)", value: 450, color: "#0088FE", clv: 15000000 },
  { name: "Loyal (3-5 orders)", value: 890, color: "#00C49F", clv: 8500000 },
  { name: "Regular (2-3 orders)", value: 1450, color: "#FFBB28", clv: 4200000 },
  { name: "One-time", value: 2340, color: "#FF8042", clv: 1800000 },
]

const topCustomers = [
  {
    id: "1",
    name: "Almaz Tadesse",
    email: "almaz.t@email.com",
    orders: 24,
    totalSpent: 42500000,
    avgOrderValue: 1770833,
    lastOrder: "2024-01-15",
    segment: "VIP"
  },
  {
    id: "2",
    name: "Dawit Haile",
    email: "dawit.h@email.com",
    orders: 18,
    totalSpent: 35200000,
    avgOrderValue: 1955556,
    lastOrder: "2024-01-14",
    segment: "VIP"
  },
  {
    id: "3",
    name: "Hanan Ahmed",
    email: "hanan.a@email.com",
    orders: 15,
    totalSpent: 28900000,
    avgOrderValue: 1926667,
    lastOrder: "2024-01-12",
    segment: "Loyal"
  },
  {
    id: "4",
    name: "Yonas Bekele",
    email: "yonas.b@email.com",
    orders: 12,
    totalSpent: 18500000,
    avgOrderValue: 1541667,
    lastOrder: "2024-01-10",
    segment: "Loyal"
  },
  {
    id: "5",
    name: "Sara Mekonnen",
    email: "sara.m@email.com",
    orders: 9,
    totalSpent: 14200000,
    avgOrderValue: 1577778,
    lastOrder: "2024-01-08",
    segment: "Regular"
  },
]

export default function CustomerAnalyticsDashboard() {
  const totalCustomers = cohortData[cohortData.length - 1].newCustomers + cohortData[cohortData.length - 1].returning
  const repeatRate = ((cohortData[cohortData.length - 1].returning / totalCustomers) * 100).toFixed(1)
  const avgCLV = customerSegments.reduce((sum, seg) => sum + seg.clv, 0) / customerSegments.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Understand customer behavior and lifetime value
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Repeat Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {repeatRate}%
            </div>
            <p className="text-xs text-muted-foreground">Returning customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg CLV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgCLV)}
            </div>
            <p className="text-xs text-muted-foreground">Customer lifetime value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              VIP Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {customerSegments[0].value}
            </div>
            <p className="text-xs text-muted-foreground">5+ orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition & Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newCustomers" fill="hsl(var(--chart-1))" name="New Customers" stackId="a" />
                  <Bar dataKey="returning" fill="hsl(var(--chart-2))" name="Returning" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Segment</th>
                  <th className="pb-3 pr-4">Orders</th>
                  <th className="pb-3 pr-4">Total Spent</th>
                  <th className="pb-3 pr-4">Avg Order</th>
                  <th className="pb-3">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={customer.segment === 'VIP' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {customer.segment}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm font-medium">{customer.orders}</td>
                    <td className="py-3 pr-4 text-sm font-bold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {formatCurrency(customer.avgOrderValue)}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Segment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Value Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {customerSegments.map((segment, idx) => (
              <div key={idx} className="p-4 border rounded-lg" style={{ borderColor: segment.color }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <h4 className="font-semibold text-sm">{segment.name}</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{segment.value}</p>
                  <p className="text-xs text-muted-foreground">customers</p>
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(segment.clv)} CLV
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
