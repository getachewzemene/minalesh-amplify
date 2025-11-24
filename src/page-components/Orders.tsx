"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  subtotal: string | number;
  totalAmount: string | number;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
            setOrders(data);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders(); else setLoading(false);
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-500';
      case 'processing':
      case 'fulfilled':
        return 'bg-purple-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10">
        <Container>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-muted-foreground mt-1">Track and manage your orders</p>
          </div>
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-gradient-card shadow-card">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton variant="shimmer" className="h-5 w-32" />
                        <Skeleton variant="shimmer" className="h-4 w-48" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton variant="shimmer" className="h-6 w-20 rounded-full" />
                        <Skeleton variant="shimmer" className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                    <Skeleton variant="shimmer" className="h-20 w-full" />
                    <div className="flex justify-end">
                      <Skeleton variant="shimmer" className="h-5 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && orders.length === 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">When you place orders, they will appear here</p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id} className="bg-gradient-card shadow-card">
                <CardHeader>
                  <div className="flex flex-wrap justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        Order #{order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')} at {format(new Date(order.createdAt), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Badge className={`${getStatusColor(order.status)} text-white border-0`}>
                        {order.status}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'outline'}>
                        {order.paymentStatus}
                      </Badge>
                      {order.paymentMethod && (
                        <Badge variant="secondary">{order.paymentMethod}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.paymentMethod === 'TeleBirr' && order.paymentReference && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">TeleBirr Reference:</span> {order.paymentReference}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm mb-2">Order Items</h4>
                    {order.orderItems.map(oi => (
                      <div key={oi.id} className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{oi.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {oi.quantity} × {Number(oi.price).toLocaleString()} ETB
                          </p>
                        </div>
                        <p className="font-semibold">{Number(oi.total).toLocaleString()} ETB</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 mt-4 border-t">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      {Number(order.totalAmount).toLocaleString()} ETB
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
