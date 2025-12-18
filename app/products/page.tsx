'use client'

/**
 * Products Page
 * 
 * Implements server-side search and filtering through the /api/products/search endpoint.
 * Products are fetched dynamically based on URL parameters from the AdvancedSearch component.
 * Supports offline viewing of previously fetched products using IndexedDB caching.
 */

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Star, ShoppingCart, Eye, Heart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { useRouter } from "next/navigation"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AdvancedSearch } from "@/components/search/AdvancedSearch"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingState, ProductCardSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { 
  cacheProducts, 
  getAllCachedProducts, 
  isOnline,
  type CachedProduct 
} from "@/lib/offline-cache"
import phoneImg from "@/assets/products/phone.jpg"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: { src: string } | typeof phoneImg
  category: string
  hasAR?: boolean
  vendor: string
  isVerifiedVendor?: boolean
}

// API response interfaces for better type safety
interface ApiProduct {
  id: string | number
  name: string
  price: string | number
  salePrice?: string | number
  ratingAverage?: string | number
  ratingCount?: number
  images?: string[]
  category?: { name?: string }
  vendor?: { displayName?: string; vendorStatus?: string }
}

/**
 * Transforms API product data to the frontend Product interface
 */
function transformApiProduct(p: ApiProduct): Product {
  let images: string[] = []
  if (Array.isArray(p.images)) {
    images = p.images as string[]
  } else if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images)
      if (Array.isArray(parsed)) images = parsed
    } catch {}
  }
  const firstImage = images.length > 0 ? images[0] : null
  
  return {
    id: String(p.id),
    name: String(p.name),
    price: parseFloat(String(p.price)),
    originalPrice: p.salePrice ? parseFloat(String(p.salePrice)) : undefined,
    rating: parseFloat(String(p.ratingAverage || 0)),
    reviews: p.ratingCount || 0,
    image: firstImage ? { src: firstImage.startsWith('/') ? firstImage : `/${firstImage}` } : phoneImg,
    category: p.category?.name || 'Uncategorized',
    hasAR: false,
    vendor: p.vendor?.displayName || 'Unknown',
    isVerifiedVendor: p.vendor?.vendorStatus === 'approved'
  }
}

// Mock products removed - products will be fetched from the API

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Handle online/offline status changes
  useEffect(() => {
    setIsOffline(!isOnline())
    
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load cached products for offline use
  const loadCachedProducts = useCallback(async () => {
    try {
      const cachedProducts = await getAllCachedProducts()
      if (cachedProducts.length > 0) {
        // Transform cached products to match Product interface
        const transformedProducts: Product[] = cachedProducts.map((p: CachedProduct) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          rating: p.rating,
          reviews: p.reviews,
          image: p.image ? { src: p.image } : phoneImg,
          category: p.category,
          hasAR: p.hasAR,
          vendor: p.vendor,
          isVerifiedVendor: p.isVerifiedVendor
        }))
        setProducts(transformedProducts)
        setIsUsingCache(true)
        setError(null)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to load cached products:', err)
      return false
    }
  }, [])

  // Cache products for offline use
  const cacheProductsForOffline = useCallback(async (productsToCache: Product[]) => {
    try {
      const productsForCache = productsToCache.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating,
        reviews: p.reviews,
        image: typeof p.image === 'string' ? p.image : (p.image?.src || ''),
        category: p.category,
        vendor: p.vendor,
        isVerifiedVendor: p.isVerifiedVendor,
        hasAR: p.hasAR
      }))
      await cacheProducts(productsForCache)
    } catch (err) {
      console.error('Failed to cache products:', err)
    }
  }, [])

  // Fetch products when search parameters change
  useEffect(() => {
    const fetchProducts = async () => {
      // Build query string from search params
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => {
        params.append(key, value)
      })
      
      // If offline, load from cache
      if (!isOnline()) {
        setLoading(true)
        const loaded = await loadCachedProducts()
        if (!loaded) {
          setError('You are offline. No cached products available.')
          setProducts([])
        }
        setLoading(false)
        return
      }
      
      // Always fetch from API
      setLoading(true)
      setError(null)
      setIsUsingCache(false)
      
      try {
        const url = params.toString() 
          ? `/api/products/search?${params.toString()}` 
          : '/api/products/search'
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          
          // Transform backend data to match Product interface
          const transformedProducts = data.products.map((p: ApiProduct) => transformApiProduct(p))
          
          setProducts(transformedProducts)
          
          // Cache products for offline use
          if (transformedProducts.length > 0) {
            await cacheProductsForOffline(transformedProducts)
          }
        } else {
          // If fetch fails, try to load from cache
          const loaded = await loadCachedProducts()
          if (!loaded) {
            setError('Failed to fetch products')
            setProducts([])
          }
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        // If fetch fails, try to load from cache
        const loaded = await loadCachedProducts()
        if (!loaded) {
          setError('An error occurred while fetching products')
          setProducts([])
        } else {
          setError('Unable to fetch latest products. Showing cached version.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [searchParams, loadCachedProducts, cacheProductsForOffline])

  // Refresh products handler for OfflineIndicator
  const handleRefresh = useCallback(async () => {
    if (!isOnline()) {
      toast.error("You're offline. Please connect to the internet to refresh.")
      return
    }
    
    setLoading(true)
    setError(null)
    setIsUsingCache(false)
    
    try {
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => {
        params.append(key, value)
      })
      
      const url = params.toString() 
        ? `/api/products/search?${params.toString()}` 
        : '/api/products/search'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const transformedProducts = data.products.map((p: ApiProduct) => transformApiProduct(p))
        
        setProducts(transformedProducts)
        if (transformedProducts.length > 0) {
          await cacheProductsForOffline(transformedProducts)
        }
        toast.success("Products refreshed successfully!")
      } else {
        throw new Error('Failed to fetch products')
      }
    } catch (err) {
      console.error('Error refreshing products:', err)
      toast.error("Failed to refresh products.")
    } finally {
      setLoading(false)
    }
  }, [searchParams, cacheProductsForOffline])

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: typeof product.image === 'string' ? product.image : product.image.src,
      quantity: 1
    })
    toast.success("Added to cart!")
  }

  const handleAddToWishlist = (product: Product) => {
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return
    }
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: typeof product.image === 'string' ? product.image : product.image.src
    })
    toast.success("Added to wishlist!")
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Container className="py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold">All Products</h1>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="default"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <AdvancedSearch />
          </div>
          
          {/* Offline/Cache indicator */}
          <OfflineIndicator 
            isUsingCache={isUsingCache} 
            onRefresh={handleRefresh}
            className="mb-4"
          />
          
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ProductCardSkeleton count={8} />
            </div>
          )}
          
          {error && !isUsingCache && (
            <ErrorState 
              message={error}
              onRetry={handleRefresh}
            />
          )}
          
          {!loading && (isUsingCache || !error) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
            <div
              key={product.id}
              className="group relative border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-card"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image.src}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {product.originalPrice && (
                  <Badge className="absolute top-2 left-2 bg-red-500">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                )}
                {product.hasAR && (
                  <Badge className="absolute top-2 right-2 bg-purple-500">
                    AR View
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.vendor}</p>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({product.reviews})
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    ETB {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ETB {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={() => handleAddToWishlist(product)}
                    variant="outline"
                    size="sm"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => router.push(`/product/${product.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
        
        {!loading && products.length === 0 && !isOffline && !error && (
          <EmptyState 
            variant="products"
            title="Products Available Soon"
            description="Our vendors are currently uploading their products. Check back soon for amazing deals!"
          />
        )}
        
        {!loading && products.length === 0 && !isOffline && error && (
          <EmptyState 
            variant="products"
            title="No products found"
            description="Try adjusting your filters or search query to find what you're looking for."
            action={{
              label: "Clear filters",
              onClick: () => router.push('/products')
            }}
          />
        )}
        
        {!loading && products.length === 0 && isOffline && (
          <EmptyState 
            variant="products"
            title="No cached products available"
            description="You're offline and no products have been cached yet. Please connect to the internet to browse products."
          />
        )}
      </Container>
      <Footer />
      </div>
    </ErrorBoundary>
  )
}

export default function Products() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <Container className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">All Products</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductCardSkeleton count={8} />
          </div>
        </Container>
        <Footer />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
