'use client'

import { useEffect, useState } from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { FlashSaleCard } from '@/components/flash-sales/FlashSaleCard'
import { Loader2, Zap, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { parsePrimaryImage, getEffectivePrice } from '@/lib/image-utils'

interface FlashSale {
  id: string
  name: string
  productId: string
  discountValue: number
  originalPrice: number
  flashPrice: number
  startsAt: string | Date
  endsAt: string | Date
  product: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

interface TrendingProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  images: any
  ratingAverage: number
  ratingCount: number
}

export function MobileHeroCarousel() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch flash sales
        const flashResponse = await fetch('/api/flash-sales')
        if (flashResponse.ok) {
          const flashData = await flashResponse.json()
          setFlashSales((flashData.flashSales || []).slice(0, 3))
        }

        // Fetch trending products
        const trendingResponse = await fetch('/api/recommendations/trending?days=7&limit=3')
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json()
          setTrendingProducts((trendingData.products || []).slice(0, 3))
        }
      } catch (err) {
        console.error('Error fetching carousel data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const allItems = [
    ...flashSales.map(sale => ({ type: 'flash' as const, data: sale })),
    ...trendingProducts.map(product => ({ type: 'trending' as const, data: product }))
  ]

  if (allItems.length === 0) {
    return null
  }

  return (
    <div className="w-full px-4 py-6">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {allItems.map((item, index) => (
            <CarouselItem key={index}>
              {item.type === 'flash' ? (
                <Card 
                  className="overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/product/${item.data.product.slug}`)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <Badge className="absolute top-2 left-2 z-10 bg-red-600">
                        <Zap className="h-3 w-3 mr-1" />
                        Flash Sale
                      </Badge>
                      <Badge className="absolute top-2 right-2 z-10 bg-yellow-500 text-black font-bold">
                        {item.data.originalPrice > 0 ? Math.round(((item.data.originalPrice - item.data.flashPrice) / item.data.originalPrice) * 100) : 0}% OFF
                      </Badge>
                      <div className="relative w-full aspect-square bg-gray-100">
                        <Image
                          src={item.data.product.images?.[0] || '/placeholder-product.png'}
                          alt={item.data.product.name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                        {item.data.product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-600">
                          {formatCurrency(item.data.flashPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(item.data.originalPrice)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  className="overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/product/${item.data.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                      <div className="relative w-full aspect-square bg-gray-100">
                        <Image
                          src={parsePrimaryImage(item.data.images) || '/placeholder-product.png'}
                          alt={item.data.name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                        {item.data.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(getEffectivePrice(item.data))}
                        </span>
                        {item.data.salePrice && item.data.salePrice < item.data.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(item.data.price)}
                          </span>
                        )}
                      </div>
                      {item.data.ratingAverage > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-medium">{item.data.ratingAverage.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({item.data.ratingCount})</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  )
}
