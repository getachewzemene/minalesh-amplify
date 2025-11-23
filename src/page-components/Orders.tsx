"use client";

import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-10">
        <Container>
          <h1 className="text-2xl font-bold mb-6">My Orders</h1>
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 bg-card space-y-3">
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
                </div>
              ))}
            </div>
          )}
          {!loading && orders.length === 0 && (
            <p className="text-muted-foreground">No orders yet.</p>
          )}
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 bg-card space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold">Order #{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">Placed {format(new Date(order.createdAt), 'PP p')}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">{order.status}</Badge>
                    <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'outline'}>{order.paymentStatus}</Badge>
                    {order.paymentMethod && <Badge>{order.paymentMethod}</Badge>}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.paymentMethod === 'TeleBirr' && order.paymentReference && (
                    <p>TeleBirr Reference: <span className="font-medium">{order.paymentReference}</span></p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2 pr-4">Item</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Price</th>
                        <th className="py-2 pr-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems.map(oi => (
                        <tr key={oi.id} className="border-t">
                          <td className="py-2 pr-4">{oi.productName}</td>
                          <td className="py-2 pr-4">{oi.quantity}</td>
                          <td className="py-2 pr-4">{Number(oi.price).toLocaleString()} ETB</td>
                          <td className="py-2 pr-4 font-medium">{Number(oi.total).toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-2 border-t mt-2">
                  <p className="text-sm">Total: <span className="font-semibold">{Number(order.totalAmount).toLocaleString()} ETB</span></p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
