'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { trackPriceAlertCreated } from '@/components/analytics';

interface PriceAlertButtonProps {
  productId: string;
  productName: string;
  currentPrice: number;
  isLoggedIn: boolean;
  onLoginRequired?: () => void;
}

export function PriceAlertButton({
  productId,
  productName,
  currentPrice,
  isLoggedIn,
  onLoginRequired,
}: PriceAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>(
    Math.floor(currentPrice * 0.9).toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [existingAlert, setExistingAlert] = useState<{
    id: string;
    targetPrice: number;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      checkExistingAlert();
    }
  }, [isLoggedIn, productId]);

  const checkExistingAlert = async () => {
    try {
      const response = await fetch('/api/user/price-alerts');
      if (response.ok) {
        const data = await response.json();
        const alert = data.alerts?.find(
          (a: { product?: { id: string }; targetPrice: number; isActive: boolean; id: string }) => 
            a.product?.id === productId
        );
        if (alert) {
          setHasAlert(true);
          setExistingAlert({
            id: alert.id,
            targetPrice: Number(alert.targetPrice),
            isActive: alert.isActive,
          });
          setTargetPrice(Number(alert.targetPrice).toString());
        }
      }
    } catch (error) {
      console.error('Error checking existing alert:', error);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }

    if (price >= currentPrice) {
      toast.error('Target price should be lower than current price');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          targetPrice: price,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setHasAlert(true);
        setExistingAlert({
          id: data.alert.id,
          targetPrice: price,
          isActive: true,
        });
        setIsOpen(false);
        toast.success(data.message || 'Price alert created!');
        trackPriceAlertCreated(productId, price);
      } else {
        toast.error(data.error || 'Failed to create price alert');
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAlert) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/user/price-alerts?id=${existingAlert.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setHasAlert(false);
        setExistingAlert(null);
        setTargetPrice(Math.floor(currentPrice * 0.9).toString());
        toast.success('Price alert removed');
        setIsOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove price alert');
      }
    } catch (error) {
      console.error('Error deleting price alert:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!existingAlert) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/price-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingAlert.id,
          isActive: !existingAlert.isActive,
        }),
      });

      if (response.ok) {
        setExistingAlert({
          ...existingAlert,
          isActive: !existingAlert.isActive,
        });
        toast.success(
          existingAlert.isActive ? 'Price alert paused' : 'Price alert resumed'
        );
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update price alert');
      }
    } catch (error) {
      console.error('Error toggling price alert:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLoginRequired?.()}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Login to set price alerts</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasAlert ? 'default' : 'outline'}
              size="icon"
              className={hasAlert ? 'bg-primary' : ''}
            >
              {hasAlert ? (
                <Bell className="h-4 w-4 fill-current" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {hasAlert
                ? `Alert set at ${existingAlert?.targetPrice} ETB`
                : 'Set price alert'}
            </p>
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alert
          </DialogTitle>
          <DialogDescription>
            {hasAlert
              ? 'Manage your price alert for this product.'
              : 'Get notified when the price drops to your target.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">{productName}</p>
            <p className="text-sm text-muted-foreground">
              Current price:{' '}
              <span className="font-semibold text-foreground">
                {currentPrice.toLocaleString()} ETB
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (ETB)</Label>
            <Input
              id="targetPrice"
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              min={1}
              max={currentPrice - 1}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll email you when the price drops to this amount or below.
            </p>
          </div>

          {existingAlert && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground flex-1">
                Alert is currently{' '}
                <span
                  className={
                    existingAlert.isActive
                      ? 'text-green-600 font-medium'
                      : 'text-yellow-600 font-medium'
                  }
                >
                  {existingAlert.isActive ? 'active' : 'paused'}
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingAlert && (
            <>
              <Button
                variant="outline"
                onClick={handleToggle}
                disabled={isLoading}
                className="flex-1"
              >
                {existingAlert.isActive ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasAlert ? 'Update Alert' : 'Set Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PriceAlertButton;
