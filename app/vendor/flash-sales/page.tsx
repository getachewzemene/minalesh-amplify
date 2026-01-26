'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Plus, Calendar, TrendingDown, Package } from 'lucide-react'
import { toast } from 'sonner'

interface FlashSale {
  id: string
  name: string
  description?: string
  productId: string
  discountType: string
  discountValue: number
  originalPrice: number
  flashPrice: number
  stockLimit: number | null
  stockSold: number
  startsAt: string
  endsAt: string
  isActive: boolean
  product: {
    name: string
    slug: string
    images: string[]
    price: number
  }
}

export default function VendorFlashSalesPage() {
  const router = useRouter()
  const { loading, profile, user } = useAuth()
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else if (!profile?.isVendor) {
        router.replace('/')
      }
    }
  }, [loading, profile, user, router])

  useEffect(() => {
    if (user && profile?.isVendor) {
      fetchFlashSales()
    }
  }, [user, profile])

  const fetchFlashSales = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vendors/flash-sales')
      if (response.ok) {
        const data = await response.json()
        setFlashSales(data.flashSales)
      } else {
        toast.error('Failed to load flash sales')
      }
    } catch (error) {
      console.error('Error fetching flash sales:', error)
      toast.error('Failed to load flash sales')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !user || !profile?.isVendor) {
    return null
  }

  const getStatusBadge = (sale: FlashSale) => {
    const now = new Date()
    const start = new Date(sale.startsAt)
    const end = new Date(sale.endsAt)

    if (now < start) {
      return <Badge variant="secondary">Upcoming</Badge>
    } else if (now >= start && now < end) {
      return <Badge className="bg-green-600">Active</Badge>
    } else {
      return <Badge variant="outline">Ended</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-red-600" />
            My Flash Sales
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage flash sales for your products
          </p>
        </div>
        <Button 
          onClick={() => toast.info('Create form coming soon! Use API endpoint for now.')}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Flash Sale
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading flash sales...</p>
        </div>
      ) : flashSales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Flash Sales Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first flash sale to boost sales with time-limited offers
            </p>
            <div className="bg-muted p-4 rounded-lg max-w-2xl mx-auto mt-6">
              <h4 className="font-semibold mb-2">API Usage:</h4>
              <pre className="text-xs text-left overflow-x-auto">
{`POST /api/vendors/flash-sales
{
  "name": "Weekend Flash Sale",
  "productId": "your-product-id",
  "discountType": "percentage",
  "discountValue": 30,
  "originalPrice": 1000,
  "flashPrice": 700,
  "stockLimit": 50,
  "startsAt": "2024-12-25T10:00:00Z",
  "endsAt": "2024-12-25T22:00:00Z"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flashSales.map((sale) => (
            <Card key={sale.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg line-clamp-1">{sale.name}</CardTitle>
                  {getStatusBadge(sale)}
                </div>
                <CardDescription className="line-clamp-2">
                  {sale.description || sale.product.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium line-clamp-1">{sale.product.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Flash Price</p>
                    <p className="text-lg font-bold text-red-600">
                      ETB {sale.flashPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Original Price</p>
                    <p className="text-sm line-through text-muted-foreground">
                      ETB {sale.originalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span>{Math.round(((sale.originalPrice - sale.flashPrice) / sale.originalPrice) * 100)}% off</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {sale.stockLimit 
                        ? `${sale.stockLimit - sale.stockSold}/${sale.stockLimit} left`
                        : 'Unlimited'
                      }
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Starts: {formatDate(sale.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Ends: {formatDate(sale.endsAt)}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(`/flash-sales`, '_blank')}
                >
                  View on Site
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
