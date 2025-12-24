import { Badge } from "@/components/ui/badge"
import { TrendingUp, Star, Flame, Package, Clock } from "lucide-react"

interface ProductBadgesProps {
  isBestSeller?: boolean
  isTrending?: boolean
  isNew?: boolean
  stockQuantity: number
  hasDiscount?: boolean
  rating?: number
  className?: string
}

export function ProductBadges({
  isBestSeller,
  isTrending,
  isNew,
  stockQuantity,
  hasDiscount,
  rating,
  className = ""
}: ProductBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Best Seller Badge */}
      {isBestSeller && (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold shadow-lg">
          <Star className="w-3 h-3 mr-1 fill-white" />
          Best Seller
        </Badge>
      )}

      {/* Trending Badge */}
      {isTrending && (
        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold shadow-lg">
          <TrendingUp className="w-3 h-3 mr-1" />
          Trending
        </Badge>
      )}

      {/* New Arrival Badge */}
      {isNew && (
        <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold shadow-lg">
          <Flame className="w-3 h-3 mr-1" />
          New
        </Badge>
      )}

      {/* Limited Stock Badge */}
      {stockQuantity > 0 && stockQuantity <= 5 && (
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          Only {stockQuantity} Left!
        </Badge>
      )}

      {/* Low Stock Warning */}
      {stockQuantity > 5 && stockQuantity <= 10 && (
        <Badge className="bg-orange-500 text-white font-semibold shadow-lg">
          <Package className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      )}

      {/* Highly Rated Badge */}
      {rating && rating >= 4.5 && (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg">
          <Star className="w-3 h-3 mr-1 fill-white" />
          Highly Rated
        </Badge>
      )}

      {/* Sale/Discount Badge */}
      {hasDiscount && (
        <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold shadow-lg">
          SALE
        </Badge>
      )}
    </div>
  )
}

/**
 * Determine which badges to show for a product
 */
export function getProductBadges(product: {
  createdAt: Date | string
  stockQuantity: number
  salePrice?: number | null
  price: number
  ratingAverage?: number
  salesCount?: number
  viewCount?: number
}) {
  const createdDate = typeof product.createdAt === 'string' 
    ? new Date(product.createdAt) 
    : product.createdAt

  // Product is "new" if created within last 30 days
  const isNew = (Date.now() - createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000

  // Best seller if high sales count
  const isBestSeller = (product.salesCount || 0) > 50

  // Trending if high view count recently
  const isTrending = (product.viewCount || 0) > 100

  // Has discount
  const hasDiscount = !!product.salePrice && product.salePrice < product.price

  return {
    isNew,
    isBestSeller,
    isTrending,
    hasDiscount,
    stockQuantity: product.stockQuantity,
    rating: product.ratingAverage
  }
}
