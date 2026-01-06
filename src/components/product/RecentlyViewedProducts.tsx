'use client'

import { useState, useEffect } from "react"
import { Clock, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { STORAGE_KEYS, PRODUCT_LIMITS } from "@/lib/product-constants"

interface ViewedProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  image: string
  viewedAt: number
}

export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<ViewedProduct[]>([])
  const router = useRouter()

  useEffect(() => {
    loadRecentlyViewed()
    
    // Listen for storage changes (from other tabs or windows)
    const handleStorageChange = () => {
      loadRecentlyViewed()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('recently-viewed-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('recently-viewed-updated', handleStorageChange)
    }
  }, [])

  const loadRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      if (stored) {
        const items = JSON.parse(stored) as ViewedProduct[]
        // Sort by most recent first
        const sorted = items.sort((a, b) => b.viewedAt - a.viewedAt)
        setProducts(sorted.slice(0, PRODUCT_LIMITS.MAX_RECENTLY_VIEWED))
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    }
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recently Viewed Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group cursor-pointer"
              onClick={() => router.push(`/product/${product.id}`)}
            >
              <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2 relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-2 group-hover:scale-110 transition-transform"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                />
              </div>
              <h4 className="text-sm font-medium line-clamp-2 mb-1 min-h-[2.5rem]">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(product.salePrice || product.price)}
                </span>
                {product.salePrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Track a product view - call this when a user views a product detail page
 */
export function trackProductView(product: {
  id: string
  name: string
  price: number
  salePrice?: number | null
  image: string
}) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
    let items: ViewedProduct[] = stored ? JSON.parse(stored) : []
    
    // Remove existing entry for this product
    items = items.filter(item => item.id !== product.id)
    
    // Add to the beginning
    items.unshift({
      ...product,
      viewedAt: Date.now()
    })
    
    // Keep only the most recent items
    items = items.slice(0, PRODUCT_LIMITS.MAX_RECENTLY_VIEWED)
    
    localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items))
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('recently-viewed-updated'))
  } catch (error) {
    console.error('Error tracking product view:', error)
  }
}
