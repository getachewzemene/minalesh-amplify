"use client"

import { ProductSection } from "@/components/product-section"
import { TrendingUp } from "lucide-react"

interface TrendingProductsProps {
  limit?: number
  days?: number
  showTitle?: boolean
}

export function TrendingProducts({ 
  limit = 8, 
  days = 7,
  showTitle = true 
}: TrendingProductsProps) {
  return (
    <div className="relative">
      {showTitle && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse">
            <TrendingUp className="h-4 w-4" />
            Hot Trending Now
          </div>
        </div>
      )}
      <ProductSection
        title="Trending Products"
        description={`Most popular products in the last ${days} days based on views, sales, and reviews`}
        endpoint={`/api/recommendations/trending?days=${days}`}
        limit={limit}
        showViewAll={true}
        viewAllLink="/products?sort=trending"
      />
    </div>
  )
}
