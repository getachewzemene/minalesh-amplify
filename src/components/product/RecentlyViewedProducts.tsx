'use client'

import { useState, useEffect } from "react"
import { Clock, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { STORAGE_KEYS, PRODUCT_LIMITS } from "@/lib/product-constants"
import { toast } from "sonner"

interface ViewedProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  image: string
  viewedAt: number
}

/**
 * Check if browsing history tracking is enabled
 */
export function isBrowsingHistoryEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const setting = localStorage.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED)
    // Default to enabled if not set
    return setting === null ? true : setting === 'true'
  } catch {
    return true
  }
}

/**
 * Set browsing history tracking preference
 */
export function setBrowsingHistoryEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, String(enabled))
    // If disabling, also clear the history
    if (!enabled) {
      clearBrowsingHistory()
    }
    // Dispatch event to notify components
    window.dispatchEvent(new Event('browsing-history-preference-changed'))
  } catch (error) {
    console.error('Error setting browsing history preference:', error)
  }
}

/**
 * Clear all browsing history
 */
export function clearBrowsingHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENTLY_VIEWED)
    window.dispatchEvent(new Event('recently-viewed-updated'))
  } catch (error) {
    console.error('Error clearing browsing history:', error)
  }
}

export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<ViewedProduct[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if browsing history is enabled
    setIsEnabled(isBrowsingHistoryEnabled())
    loadRecentlyViewed()
    
    // Listen for storage changes (from other tabs or windows)
    const handleStorageChange = () => {
      loadRecentlyViewed()
    }

    const handlePreferenceChange = () => {
      setIsEnabled(isBrowsingHistoryEnabled())
      loadRecentlyViewed()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('recently-viewed-updated', handleStorageChange)
    window.addEventListener('browsing-history-preference-changed', handlePreferenceChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('recently-viewed-updated', handleStorageChange)
      window.removeEventListener('browsing-history-preference-changed', handlePreferenceChange)
    }
  }, [])

  const loadRecentlyViewed = () => {
    try {
      // Don't load if browsing history is disabled
      if (!isBrowsingHistoryEnabled()) {
        setProducts([])
        return
      }
      
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      if (stored) {
        const items = JSON.parse(stored) as ViewedProduct[]
        // Sort by most recent first
        const sorted = items.sort((a, b) => b.viewedAt - a.viewedAt)
        setProducts(sorted.slice(0, PRODUCT_LIMITS.MAX_RECENTLY_VIEWED))
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
      setProducts([])
    }
  }

  const handleClearHistory = () => {
    clearBrowsingHistory()
    setProducts([])
    toast.success('Browsing history cleared')
  }

  // Don't render if browsing history is disabled or no products
  if (!isEnabled || products.length === 0) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recently Viewed Products
          </CardTitle>
          <CardDescription className="mt-1">
            Your browsing history (last {products.length} products)
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearHistory}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
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
 * Respects user's privacy preferences
 */
export function trackProductView(product: {
  id: string
  name: string
  price: number
  salePrice?: number | null
  image: string
}) {
  try {
    // Check if browsing history is enabled (privacy opt-out)
    if (!isBrowsingHistoryEnabled()) {
      return
    }
    
    const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
    let items: ViewedProduct[] = stored ? JSON.parse(stored) : []
    
    // Remove existing entry for this product
    items = items.filter(item => item.id !== product.id)
    
    // Add to the beginning
    items.unshift({
      ...product,
      viewedAt: Date.now()
    })
    
    // Keep only the most recent items (20 products per requirement)
    items = items.slice(0, PRODUCT_LIMITS.MAX_RECENTLY_VIEWED)
    
    localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items))
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('recently-viewed-updated'))
  } catch (error) {
    console.error('Error tracking product view:', error)
  }
}
