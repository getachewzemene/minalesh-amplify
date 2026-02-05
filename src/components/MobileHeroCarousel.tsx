'use client'

import { useEffect, useState } from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Sparkles, TrendingUp, Zap } from 'lucide-react'
import Image from 'next/image'
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
  ratingAverage?: number
  ratingCount?: number
}

interface NewProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  images: any
  ratingAverage?: number
  ratingCount?: number
}

export function MobileHeroCarousel() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([])
  const [newProducts, setNewProducts] = useState<NewProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const [flashResult, trendingResult, newResult] = await Promise.allSettled([
          fetch('/api/flash-sales'),
          fetch('/api/recommendations/trending?days=7&limit=3'),
          fetch('/api/products/new?days=30&limit=3'),
        ])

        // Flash sales
        if (flashResult.status === 'fulfilled' && flashResult.value.ok) {
          const flashData = await flashResult.value.json()
          setFlashSales((flashData.flashSales || []).slice(0, 3))
        }

        // Trending products (API returns { success, data, metadata })
        if (trendingResult.status === 'fulfilled' && trendingResult.value.ok) {
          const trendingData = await trendingResult.value.json()
          const products = Array.isArray(trendingData?.data)
            ? trendingData.data
            : (trendingData?.products || [])
          setTrendingProducts(products.slice(0, 3))
        }

        // New products
        if (newResult.status === 'fulfilled' && newResult.value.ok) {
          const newData = await newResult.value.json()
          setNewProducts((newData.products || []).slice(0, 3))
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

  type CarouselItemType =
    | { type: 'flash'; key: string; data: FlashSale }
    | { type: 'trending'; key: string; data: TrendingProduct }
    | { type: 'new'; key: string; data: NewProduct }

  const flashItems: CarouselItemType[] = flashSales.map((sale) => ({
    type: 'flash',
    key: sale.product?.id || sale.productId,
    data: sale,
  }))

  const trendingItems: CarouselItemType[] = trendingProducts.map((product) => ({
    type: 'trending',
    key: product.id,
    data: product,
  }))

  const newItems: CarouselItemType[] = newProducts.map((product) => ({
    type: 'new',
    key: product.id,
    data: product,
  }))

  // Interleave items for a mix, and de-dupe by product id
  const seen = new Set<string>()
  const queues: CarouselItemType[][] = [flashItems, trendingItems, newItems]
  const allItems: CarouselItemType[] = []
  while (queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (!next) continue
      if (seen.has(next.key)) continue
      seen.add(next.key)
      allItems.push(next)
    }
  }

  if (allItems.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-full overflow-hidden px-4 py-4">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full max-w-full"
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
                      {item.type === 'trending' ? (
                        <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      ) : (
                        <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-emerald-500 to-teal-500">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      )}
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
                      {Number(item.data.ratingAverage || 0) > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-medium">{Number(item.data.ratingAverage).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({Number(item.data.ratingCount || 0)})</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 z-10" />
        <CarouselNext className="right-2 z-10" />
      </Carousel>
    </div>
  )
}
