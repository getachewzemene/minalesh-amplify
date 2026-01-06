'use client'

import { useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface PriceAlertButtonProps {
  productId: string
  productName: string
  currentPrice: number
  className?: string
}

export function PriceAlertButton({
  productId,
  productName,
  currentPrice,
  className,
}: PriceAlertButtonProps) {
  const [open, setOpen] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasAlert, setHasAlert] = useState(false)

  const handleCreateAlert = async () => {
    const price = parseFloat(targetPrice)
    
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    if (price >= currentPrice) {
      toast.error('Target price must be lower than current price')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          targetPrice: price,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create price alert')
      }

      setHasAlert(true)
      setOpen(false)
      toast.success(`Price alert set! We'll notify you when the price drops to ${formatCurrency(price)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create price alert')
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrices = [
    Math.round(currentPrice * 0.9), // 10% off
    Math.round(currentPrice * 0.8), // 20% off
    Math.round(currentPrice * 0.7), // 30% off
  ].filter(price => price > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          {hasAlert ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Alert Set
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Price Alert
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when the price of "{productName}" drops to your target price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-lg font-bold">{formatCurrency(currentPrice)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Your Target Price (ETB)</Label>
            <Input
              id="targetPrice"
              type="number"
              placeholder={`e.g., ${suggestedPrices[0]}`}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              min={1}
              max={currentPrice - 1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quick select:</Label>
            <div className="flex gap-2 flex-wrap">
              {suggestedPrices.map((price) => (
                <Button
                  key={price}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetPrice(price.toString())}
                  className="text-xs"
                >
                  {formatCurrency(price)}
                  <span className="ml-1 text-muted-foreground">
                    ({Math.round((1 - price / currentPrice) * 100)}% off)
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateAlert} disabled={loading}>
            {loading ? 'Setting...' : 'Set Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
