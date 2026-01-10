'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, BellOff, Loader2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PriceAlert {
  id: string;
  targetPrice: number;
  isActive: boolean;
  triggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: string[];
  };
}

export function PriceAlertsList() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/user/price-alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load price alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (alertId: string, currentActive: boolean) => {
    setActionLoading(alertId);
    try {
      const response = await fetch('/api/user/price-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          isActive: !currentActive,
        }),
      });

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, isActive: !currentActive } : a
          )
        );
        toast.success(currentActive ? 'Alert paused' : 'Alert resumed');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update alert');
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const response = await fetch(`/api/user/price-alerts?id=${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast.success('Alert deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const getCurrentPrice = (alert: PriceAlert) => {
    return alert.product.salePrice
      ? Number(alert.product.salePrice)
      : Number(alert.product.price);
  };

  const isPriceDropped = (alert: PriceAlert) => {
    return getCurrentPrice(alert) <= Number(alert.targetPrice);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        <CardDescription>
          Get notified when prices drop to your target
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  isPriceDropped(alert)
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
                    : ''
                }`}
              >
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {alert.product.images && alert.product.images.length > 0 ? (
                    <img
                      src={alert.product.images[0] as string}
                      alt={alert.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${alert.product.slug}`}
                    className="font-medium hover:text-primary line-clamp-1"
                  >
                    {alert.product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      Target:{' '}
                      <span className="font-medium text-foreground">
                        {Number(alert.targetPrice).toLocaleString()} ETB
                      </span>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      Current:{' '}
                      <span
                        className={`font-medium ${
                          isPriceDropped(alert)
                            ? 'text-green-600'
                            : 'text-foreground'
                        }`}
                      >
                        {getCurrentPrice(alert).toLocaleString()} ETB
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isPriceDropped(alert) && (
                      <Badge variant="default" className="bg-green-600">
                        Price Dropped!
                      </Badge>
                    )}
                    <Badge
                      variant={alert.isActive ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggle(alert.id, alert.isActive)}
                    disabled={actionLoading === alert.id}
                  >
                    {actionLoading === alert.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : alert.isActive ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={actionLoading === alert.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Price Alert</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this price alert? You
                          won&apos;t be notified about price drops for this product
                          anymore.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(alert.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No price alerts yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Browse products and set alerts to track price drops
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PriceAlertsList;
