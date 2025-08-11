import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, LineChart, BarChart3, Calendar, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const mock = {
  totals: { users: 48210, vendors: 612, orders: 125430, revenue: 25432000 },
  weekly: [
    { name: "Mon", sales: 4200, orders: 120, users: 80 },
    { name: "Tue", sales: 5100, orders: 140, users: 95 },
    { name: "Wed", sales: 4800, orders: 132, users: 88 },
    { name: "Thu", sales: 6200, orders: 158, users: 110 },
    { name: "Fri", sales: 7000, orders: 176, users: 126 },
    { name: "Sat", sales: 9500, orders: 210, users: 150 },
    { name: "Sun", sales: 6100, orders: 160, users: 100 },
  ],
  monthly: Array.from({ length: 12 }, (_, i) => ({ name: `M${i + 1}` , sales: 20000 + Math.round(Math.random()*15000), orders: 1000 + Math.round(Math.random()*500), users: 600 + Math.round(Math.random()*300) })),
  yearly: [
    { name: "2021", sales: 2_100_000, orders: 58_000, users: 18_000 },
    { name: "2022", sales: 2_850_000, orders: 71_000, users: 24_500 },
    { name: "2023", sales: 3_400_000, orders: 83_000, users: 31_200 },
    { name: "2024", sales: 4_050_000, orders: 96_000, users: 38_900 },
  ],
  topProducts: [
    { name: "iPhone 15 Pro Max", revenue: 4_049_550 },
    { name: "Ray-Ban Aviator", revenue: 79_968 },
    { name: "Galaxy Buds", revenue: 92_372 },
    { name: "Nike Cap", revenue: 21_576 },
  ],
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const data = mock[period];

  useEffect(() => {
    document.title = "Admin Dashboard — Minalesh";
  }, []);

  const exportCSV = () => {
    const rows = ["name,sales,orders,users", ...data.map((d: any) => `${d.name},${d.sales},${d.orders},${d.users}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <h1 className="sr-only">Admin Dashboard - Analytics</h1>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Users</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between"><div className="text-2xl font-bold text-primary">{mock.totals.users.toLocaleString()}</div><Users className="h-5 w-5 text-primary"/></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Vendors</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between"><div className="text-2xl font-bold text-primary">{mock.totals.vendors.toLocaleString()}</div><Store className="h-5 w-5 text-primary"/></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Orders</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between"><div className="text-2xl font-bold text-primary">{mock.totals.orders.toLocaleString()}</div><BarChart3 className="h-5 w-5 text-primary"/></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue (ETB)</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between"><div className="text-2xl font-bold text-primary">{mock.totals.revenue.toLocaleString()}</div><LineChart className="h-5 w-5 text-primary"/></CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="inline-flex rounded-md border">
              {(["weekly","monthly","yearly"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm ${period===p?"bg-primary text-primary-foreground":"hover:bg-muted"}`} aria-pressed={period===p}>
                  {p[0].toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-4 w-4"/> Export CSV
            </button>
            <div className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4"/>Quick overview</div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader><CardTitle>Sales Over Time</CardTitle></CardHeader>
              <CardContent style={{height: 300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Sales (ETB)" />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Orders" />
                  </RLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader><CardTitle>Top Products (Revenue)</CardTitle></CardHeader>
              <CardContent style={{height: 300}}>
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={mock.topProducts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (ETB)" />
                  </RBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
