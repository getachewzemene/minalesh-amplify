'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlashSaleCountdown } from './FlashSaleCountdown'
import { FlashSaleStockCounter } from './FlashSaleStockCounter'
import { FlashSaleRegistration } from './FlashSaleRegistration'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Zap } from 'lucide-react'

interface FlashSaleCardProps {
  flashSale: {
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
    startsAt: string | Date
    endsAt: string | Date
    isActive: boolean
    product: {
      id: string
      name: string
      slug: string
      images: string[]
      description?: string
    }
    registrationCount?: number
    stockRemaining?: number | null
  }
}

export function FlashSaleCard({ flashSale }: FlashSaleCardProps) {
  const saleStatus = useMemo(() => {
    const now = new Date()
    const startDate = new Date(flashSale.startsAt)
    const endDate = new Date(flashSale.endsAt)
    
    const hasStarted = now >= startDate
    const hasEnded = now >= endDate
    const isUpcoming = now < startDate

    const discountPercentage = Math.round(
      ((flashSale.originalPrice - flashSale.flashPrice) / flashSale.originalPrice) * 100
    )

    return {
      hasStarted,
      hasEnded,
      isUpcoming,
      discountPercentage,
    }
  }, [flashSale.startsAt, flashSale.endsAt, flashSale.originalPrice, flashSale.flashPrice])

  const productImage = flashSale.product.images?.[0] || '/placeholder-product.png'

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0 relative">
        {/* Flash Sale Badge */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <Badge className="bg-red-600 hover:bg-red-700 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Flash Sale
          </Badge>
          {saleStatus.isUpcoming && (
            <Badge variant="secondary">
              Upcoming
            </Badge>
          )}
        </div>

        {/* Discount Badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg">
            {saleStatus.discountPercentage}% OFF
          </Badge>
        </div>

        {/* Product Image */}
        <Link href={`/product/${flashSale.product.slug}`}>
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={productImage}
              alt={flashSale.product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Product Name */}
        <Link 
          href={`/product/${flashSale.product.slug}`}
          className="hover:underline"
        >
          <h3 className="font-semibold text-lg line-clamp-2">
            {flashSale.product.name}
          </h3>
        </Link>

        {/* Flash Sale Name */}
        {flashSale.name !== flashSale.product.name && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {flashSale.name}
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-600">
            ETB {flashSale.flashPrice.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            ETB {flashSale.originalPrice.toFixed(2)}
          </span>
        </div>

        {/* Countdown Timer */}
        <div className="py-2">
          {saleStatus.hasEnded ? (
            <p className="text-center text-red-600 font-semibold">Sale Ended</p>
          ) : saleStatus.isUpcoming ? (
            <div>
              <p className="text-sm text-center mb-2 font-medium">Starts In:</p>
              <FlashSaleCountdown targetDate={flashSale.startsAt} />
            </div>
          ) : (
            <div>
              <p className="text-sm text-center mb-2 font-medium">Ends In:</p>
              <FlashSaleCountdown targetDate={flashSale.endsAt} />
            </div>
          )}
        </div>

        {/* Stock Counter */}
        {saleStatus.hasStarted && !saleStatus.hasEnded && (
          <FlashSaleStockCounter
            flashSaleId={flashSale.id}
            stockLimit={flashSale.stockLimit}
            stockSold={flashSale.stockSold}
          />
        )}

        {/* Pre-registration */}
        {saleStatus.isUpcoming && (
          <FlashSaleRegistration
            flashSaleId={flashSale.id}
            flashSaleName={flashSale.name}
            startsAt={flashSale.startsAt}
          />
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {saleStatus.hasStarted && !saleStatus.hasEnded ? (
          <Button 
            asChild 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Link href={`/product/${flashSale.product.slug}`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Now
            </Link>
          </Button>
        ) : saleStatus.hasEnded ? (
          <Button 
            asChild 
            variant="outline"
            className="w-full"
          >
            <Link href={`/product/${flashSale.product.slug}`}>
              View Product
            </Link>
          </Button>
        ) : (
          <Button 
            asChild 
            variant="outline"
            className="w-full"
          >
            <Link href={`/product/${flashSale.product.slug}`}>
              View Details
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
