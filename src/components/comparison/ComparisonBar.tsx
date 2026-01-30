'use client'

import { X, GitCompare, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useComparison } from '@/context/comparison-context'
import { useRouter } from 'next/navigation'
import { useShop } from '@/context/shop-context'
import { PRODUCT_LIMITS } from '@/lib/product-constants'
import Image from 'next/image'

export function ComparisonBar() {
  const { compareProducts, removeFromCompare, clearCompare, isCompareBarVisible } = useComparison()
  const { addToCart } = useShop()
  const router = useRouter()

  if (!isCompareBarVisible || compareProducts.length === 0) {
    return null
  }

  const handleCompare = () => {
    if (compareProducts.length < 2) {
      return
    }
    const ids = compareProducts.map(p => p.id).join(',')
    router.push(`/compare?ids=${ids}`)
  }

  const handleAddToCart = (product: typeof compareProducts[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.image,
      category: product.category,
      vendor: product.vendor
    })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Title and clear button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <GitCompare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base hidden md:inline">Compare Products</span>
              <Badge variant="secondary" className="text-xs">{compareProducts.length}/{PRODUCT_LIMITS.MAX_COMPARISON}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCompare} className="text-muted-foreground hover:text-destructive text-xs sm:text-sm" aria-label="Clear All Products">
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </div>

          {/* Center: Product thumbnails */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide flex-1 max-w-[40%] sm:max-w-[50%] px-1 sm:px-2">
            {compareProducts.map((product) => (
              <div 
                key={product.id} 
                className="relative flex-shrink-0 group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md border bg-muted overflow-hidden">
                  <Image
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${product.name} from comparison`}
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Hover tooltip with add to cart */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground border rounded-md shadow-lg p-2 w-40">
                    <p className="text-xs font-medium truncate mb-1">{product.name}</p>
                    <p className="text-xs text-primary font-bold mb-2">
                      {product.salePrice || product.price} ETB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(product)
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty slots - hidden on very small screens */}
            {Array.from({ length: PRODUCT_LIMITS.MAX_COMPARISON - compareProducts.length }).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0 hidden sm:flex"
              >
                <span className="text-xs text-muted-foreground">+</span>
              </div>
            ))}
          </div>

          {/* Right: Compare button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleCompare}
              disabled={compareProducts.length < 2}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-xs sm:text-sm"
              aria-label={`Compare ${compareProducts.length} Products`}
            >
              <GitCompare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Compare</span> ({compareProducts.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
