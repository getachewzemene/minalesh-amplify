'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface PriceAlert {
  id: string
  targetPrice: number
  isActive: boolean
  triggered: boolean
  triggeredAt: string | null
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice: number | null
    image: string
  } | null
}

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPriceAlerts()
  }, [])

  const fetchPriceAlerts = async () => {
    try {
      const response = await fetch('/api/price-alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching price alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/price-alerts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== id))
        toast.success('Price alert deleted')
      } else {
        throw new Error('Failed to delete alert')
      }
    } catch (error) {
      toast.error('Failed to delete price alert')
    }
  }

  const getAlertStatus = (alert: PriceAlert) => {
    if (!alert.product) return { text: 'Product Unavailable', variant: 'secondary' as const }
    
    const currentPrice = alert.product.salePrice || alert.product.price
    
    if (currentPrice <= alert.targetPrice) {
      return { text: 'Price Dropped!', variant: 'default' as const }
    }
    
    const percentAway = ((currentPrice - alert.targetPrice) / currentPrice) * 100
    
    if (percentAway <= 10) {
      return { text: 'Almost There!', variant: 'secondary' as const }
    }
    
    return { text: 'Watching', variant: 'outline' as const }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        <CardDescription>
          Get notified when products reach your target price
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const status = getAlertStatus(alert)
              const currentPrice = alert.product?.salePrice || alert.product?.price || 0
              
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {alert.product ? (
                      <Image
                        src={alert.product.image}
                        alt={alert.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {alert.product?.name || 'Product no longer available'}
                      </p>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </div>
                    
                    {alert.product && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">{formatCurrency(currentPrice)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-medium text-primary">{formatCurrency(alert.targetPrice)}</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {alert.product && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/product/${alert.product?.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-sm mt-2">
              Set price alerts on products you want to buy when the price drops
            </p>
            <Button className="mt-4" onClick={() => router.push('/products')}>
              Browse Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
