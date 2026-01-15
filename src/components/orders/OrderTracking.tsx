import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, User, Camera, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { getCompletedStatuses } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

interface DeliveryTracking {
  courier: {
    name: string | null;
    phone: string | null;
    photoUrl: string | null;
    vehicleInfo: string | null;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    lastUpdate: string;
  } | null;
  estimatedDelivery: {
    start: string | null;
    end: string | null;
  };
  deliveryProof: {
    photoUrl: string;
    signatureUrl: string | null;
    recipientName: string | null;
    notes: string | null;
    deliveredAt: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: "pending" | "paid" | "confirmed" | "processing" | "packed" | "picked_up" | "in_transit" | "out_for_delivery" | "fulfilled" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_status: "pending" | "processing" | "refunded" | "failed" | "completed";
  total_amount: number;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_address?: any;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }[];
}

/**
 * Enhanced Order Tracking Component
 * 
 * Supports the enhanced order stages:
 * 1. Order placed
 * 2. Vendor confirmed
 * 3. Packed
 * 4. Picked up by courier
 * 5. In transit
 * 6. Out for delivery
 * 7. Delivered
 */
export function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOrder) {
      fetchTracking(selectedOrder.id);
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transformedData = data.map((order: any) => ({
          ...order,
          order_number: order.orderNumber,
          payment_status: order.paymentStatus,
          total_amount: order.totalAmount,
          created_at: order.createdAt,
          shipped_at: order.shippedAt,
          delivered_at: order.deliveredAt,
          shipping_address: order.shippingAddress,
          order_items: order.orderItems?.map((item: any) => ({
            id: item.id,
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
          })) || [],
        }));
        setOrders(transformedData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async (orderId: string) => {
    setTrackingLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTracking(data);
      }
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "paid":
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "processing":
      case "packed":
        return <Package className="h-5 w-5 text-indigo-500" />;
      case "picked_up":
      case "in_transit":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "out_for_delivery":
        return <Navigation className="h-5 w-5 text-orange-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-cyan-100 text-cyan-800";
      case "processing":
        return "bg-indigo-100 text-indigo-800";
      case "packed":
        return "bg-violet-100 text-violet-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "in_transit":
        return "bg-fuchsia-100 text-fuchsia-800";
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Order Placed",
      paid: "Payment Confirmed",
      confirmed: "Vendor Confirmed",
      processing: "Processing",
      packed: "Packed",
      picked_up: "Picked Up",
      in_transit: "In Transit",
      out_for_delivery: "Out for Delivery",
      fulfilled: "Fulfilled",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Enhanced progress tracker with 7 stages
  // Uses shared getCompletedStatuses utility from order-status.ts
  const getOrderProgress = (order: Order) => {
    const completedStatuses = getCompletedStatuses(order.status as OrderStatus);

    const steps = [
      { key: "pending", label: "Order Placed", completed: completedStatuses.includes("pending" as OrderStatus) },
      { key: "confirmed", label: "Confirmed", completed: completedStatuses.includes("confirmed" as OrderStatus) || completedStatuses.includes("paid" as OrderStatus) },
      { key: "packed", label: "Packed", completed: completedStatuses.includes("packed" as OrderStatus) },
      { key: "picked_up", label: "Picked Up", completed: completedStatuses.includes("picked_up" as OrderStatus) },
      { key: "in_transit", label: "In Transit", completed: completedStatuses.includes("in_transit" as OrderStatus) },
      { key: "out_for_delivery", label: "Out for Delivery", completed: completedStatuses.includes("out_for_delivery" as OrderStatus) },
      { key: "delivered", label: "Delivered", completed: completedStatuses.includes("delivered" as OrderStatus) },
    ];
    return steps;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedOrder) {
    const progress = getOrderProgress(selectedOrder);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Order Details</h2>
          <Button variant="outline" onClick={() => { setSelectedOrder(null); setTracking(null); }}>
            Back to Orders
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order #{selectedOrder.order_number}</span>
              <Badge className={getStatusColor(selectedOrder.status)}>
                {getStatusLabel(selectedOrder.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span>{format(new Date(selectedOrder.created_at), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={selectedOrder.payment_status === "completed" ? "default" : "secondary"}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                  {tracking?.estimatedDelivery?.end && (
                    <div className="flex justify-between">
                      <span>Est. Delivery:</span>
                      <span className="font-medium text-primary">
                        {format(new Date(tracking.estimatedDelivery.end), "MMM dd, h:mm a")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{selectedOrder.shipping_address.street || selectedOrder.shipping_address.line1}</p>
                    <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.country}</p>
                    <p>{selectedOrder.shipping_address.postal_code || selectedOrder.shipping_address.postalCode}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Courier Information */}
        {tracking?.courier && (tracking.courier.name || tracking.courier.phone) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Delivery Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {tracking.courier.photoUrl ? (
                  <img 
                    src={tracking.courier.photoUrl} 
                    alt={tracking.courier.name || 'Courier'} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-lg">{tracking.courier.name || 'Your Courier'}</p>
                  {tracking.courier.vehicleInfo && (
                    <p className="text-sm text-muted-foreground">{tracking.courier.vehicleInfo}</p>
                  )}
                </div>
                {tracking.courier.phone && (
                  <a 
                    href={`tel:${tracking.courier.phone}`}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Location */}
        {tracking?.location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Live Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Position</span>
                  <span className="text-xs text-muted-foreground">
                    Updated: {tracking.location.lastUpdate ? format(new Date(tracking.location.lastUpdate), "h:mm a") : 'N/A'}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-mono">
                    {tracking.location.latitude.toFixed(6)}, {tracking.location.longitude.toFixed(6)}
                  </span>
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <a 
                    href={`https://maps.google.com/?q=${tracking.location.latitude},${tracking.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Open in Maps
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Tracker - 7 Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted" />
              <div 
                className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
                style={{ 
                  width: `${(progress.filter(s => s.completed).length - 1) / (progress.length - 1) * 100}%` 
                }}
              />
              
              {/* Steps */}
              <div className="flex justify-between relative">
                {progress.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / progress.length}%` }}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-all duration-300 ${
                      step.completed 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted bg-background"
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs text-center mt-2 max-w-[60px] ${
                      step.completed ? "text-primary font-medium" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Proof */}
        {tracking?.deliveryProof && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Proof of Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <img 
                    src={tracking.deliveryProof.photoUrl} 
                    alt="Delivery proof" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
                <div className="space-y-3">
                  {tracking.deliveryProof.recipientName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Received by</p>
                      <p className="font-medium">{tracking.deliveryProof.recipientName}</p>
                    </div>
                  )}
                  {tracking.deliveryProof.deliveredAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Delivered at</p>
                      <p className="font-medium">
                        {format(new Date(tracking.deliveryProof.deliveredAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                  {tracking.deliveryProof.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="text-sm">{tracking.deliveryProof.notes}</p>
                    </div>
                  )}
                  {tracking.deliveryProof.signatureUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Signature</p>
                      <img 
                        src={tracking.deliveryProof.signatureUrl} 
                        alt="Signature" 
                        className="h-16 border rounded bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items in this Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Orders</h2>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-semibold">Order #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "MMM dd, yyyy")} • {order.order_items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}