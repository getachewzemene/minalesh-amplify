'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { ARViewer } from "@/components/ar-viewer"
import { ReviewsSection } from "@/components/reviews/ReviewsSection"
import { useShop } from "@/context/shop-context"
import { formatCurrency } from "@/lib/utils"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { 
  cacheProduct, 
  getCachedProduct, 
  isOnline,
  type CachedProduct 
} from "@/lib/offline-cache"
import sunglassesImg from "@/assets/products/sunglasses.jpg"


const mockProduct = {
  id: "1",
  name: "Ray-Ban Aviator Classic Sunglasses",
  price: 2499,
  originalPrice: 2999,
  rating: 4.6,
  reviews: 128,
  images: [
    sunglassesImg,
    sunglassesImg,
    sunglassesImg,
    sunglassesImg
  ],
  category: "Fashion",
  productType: "sunglasses" as const,
  vendor: {
    name: "Fashion Hub Ethiopia",
    rating: 4.8,
    totalSales: 1200,
    isVerified: true
  },
  inStock: true,
  stockCount: 15,
  description: `Classic aviator sunglasses with premium UV protection. These timeless shades feature a durable metal frame and high-quality lenses that provide 100% UV protection. Perfect for any occasion, from casual outings to formal events.`,
  specifications: {
    "Frame Material": "Metal Alloy",
    "Lens Material": "Polycarbonate",
    "UV Protection": "100% UV400",
    "Frame Width": "140mm",
    "Lens Width": "58mm",
    "Bridge Width": "14mm"
  },
  features: [
    "100% UV Protection",
    "Anti-Reflective Coating",
    "Scratch Resistant",
    "Lightweight Design",
    "Classic Aviator Style"
  ]
}

export default function Product() {
  const params = useParams()
  const productId = params?.id as string
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isOffline, setIsOffline] = useState(false)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const [displayProduct, setDisplayProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToCart, addToWishlist } = useShop()

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/products/${productId}`)
        if (response.ok) {
          const data = await response.json()
          setDisplayProduct(data.product)
        } else if (response.status === 404) {
          setError('Product not found')
        } else {
          setError('Failed to load product')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Handle online/offline status
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

  // Cache product for offline viewing
  useEffect(() => {
    const cacheCurrentProduct = async () => {
      // Cache the current product for offline use
      const productToCache: Omit<CachedProduct, 'cachedAt'> = {
        id: displayProduct.id,
        name: displayProduct.name,
        price: displayProduct.price,
        originalPrice: displayProduct.originalPrice,
        rating: displayProduct.rating,
        reviews: displayProduct.reviews,
        image: displayProduct.images[0]?.src || '',
        category: displayProduct.category,
        vendor: displayProduct.vendor.name,
        isVerifiedVendor: displayProduct.vendor.isVerified,
        hasAR: true,
        description: displayProduct.description,
        stockQuantity: displayProduct.stockCount,
      }
      
      await cacheProduct(productToCache)
    }

    // Only cache if online (we're viewing fresh data)
    if (isOnline()) {
      cacheCurrentProduct()
    }
  }, [displayProduct])

  // Load from cache when offline
  useEffect(() => {
    const loadCachedProduct = async () => {
      if (!isOnline() && productId) {
        const cached = await getCachedProduct(productId)
        if (cached) {
          setIsUsingCache(true)
          // Update display with cached data
          setDisplayProduct(prev => ({
            ...prev,
            id: cached.id,
            name: cached.name,
            price: cached.price,
            originalPrice: cached.originalPrice,
            rating: cached.rating,
            reviews: cached.reviews,
            description: cached.description || prev.description,
            stockCount: cached.stockQuantity || prev.stockCount,
            category: cached.category,
            vendor: {
              ...prev.vendor,
              name: cached.vendor,
              isVerified: cached.isVerifiedVendor ?? prev.vendor.isVerified,
            },
          }))
        }
      } else {
        setIsUsingCache(false)
      }
    }

    loadCachedProduct()
  }, [productId, isOffline])

  const parsePrimaryImage = (images: any) => {
    if (Array.isArray(images)) {
      const first = images[0]
      const url = typeof first === 'string' ? first : first?.url || first?.src
      return url && url.startsWith('/') ? url : url ? `/${url}` : null
    }
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0]
          const url = typeof first === 'string' ? first : first?.url || first?.src
          return url && url.startsWith('/') ? url : url ? `/${url}` : null
        }
      } catch {
        const url = images
        return url && url.startsWith('/') ? url : `/${url}`
      }
    }
    const obj = images
    const url = obj?.url || obj?.src
    return url && url.startsWith('/') ? url : url ? `/${url}` : null
  }

  const parseAllImages = (images: any): string[] => {
    if (Array.isArray(images)) {
      return images.map(img => {
        const url = typeof img === 'string' ? img : img?.url || img?.src
        return url && url.startsWith('/') ? url : url ? `/${url}` : '/placeholder-product.jpg'
      })
    }
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed)) {
          return parsed.map(img => {
            const url = typeof img === 'string' ? img : img?.url || img?.src
            return url && url.startsWith('/') ? url : url ? `/${url}` : '/placeholder-product.jpg'
          })
        }
      } catch {
        const url = images
        return [url && url.startsWith('/') ? url : `/${url}`]
      }
    }
    return ['/placeholder-product.jpg']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8">
          <Container>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Loading product...</p>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !displayProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8">
          <Container>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{error || 'Product not found'}</h2>
                <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  const productImages = parseAllImages(displayProduct.images)
  const vendorName = displayProduct.vendor?.displayName || 
                     `${displayProduct.vendor?.firstName || ''} ${displayProduct.vendor?.lastName || ''}`.trim() || 
                     'Unknown Vendor'
  const isVendorVerified = displayProduct.vendor?.vendorStatus === 'approved'
  const currentPrice = displayProduct.salePrice || displayProduct.price
  const originalPrice = displayProduct.salePrice ? displayProduct.price : null

  // Parse features and specifications
  let features: string[] = []
  let specifications: Record<string, string> = {}
  
  try {
    if (typeof displayProduct.features === 'string') {
      features = JSON.parse(displayProduct.features)
    } else if (Array.isArray(displayProduct.features)) {
      features = displayProduct.features
    }
  } catch {
    features = []
  }

  try {
    if (typeof displayProduct.specifications === 'string') {
      specifications = JSON.parse(displayProduct.specifications)
    } else if (typeof displayProduct.specifications === 'object') {
      specifications = displayProduct.specifications
    }
  } catch {
    specifications = {}
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="py-8">
        <Container>
          {/* Offline/Cache indicator */}
          {(isOffline || isUsingCache) && (
            <OfflineIndicator 
              isUsingCache={isUsingCache}
              className="mb-6"
            />
          )}
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={productImages[selectedImage]}
                  alt={displayProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${displayProduct.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                {displayProduct.category && (
                  <Badge variant="outline" className="mb-2">
                    {displayProduct.category.name}
                  </Badge>
                )}
                <h1 className="text-3xl font-bold mb-2">{displayProduct.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(Number(displayProduct.ratingAverage || 0))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Number(displayProduct.ratingAverage || 0).toFixed(1)} ({displayProduct.ratingCount || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(currentPrice)}
                  </span>
                  {originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                  {originalPrice && (
                    <Badge variant="destructive">
                      {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-gradient-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{vendorName}</h3>
                      {isVendorVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Verified
                        </span>
                      )}
                    </div>
                    {displayProduct.vendor?.city && (
                      <div className="text-sm text-muted-foreground">
                        {displayProduct.vendor.city}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {displayProduct.stockQuantity > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">
                      In Stock ({displayProduct.stockQuantity} available)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3"
                      disabled={displayProduct.stockQuantity <= 0}
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 text-sm">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(displayProduct.stockQuantity, quantity + 1))}
                      className="px-3"
                      disabled={displayProduct.stockQuantity <= 0}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
                    size="lg"
                    disabled={displayProduct.stockQuantity <= 0}
                    onClick={() => addToCart({ 
                      id: displayProduct.id, 
                      name: displayProduct.name, 
                      price: currentPrice, 
                      image: productImages[0], 
                      category: displayProduct.category?.name || 'Uncategorized', 
                      vendor: vendorName
                    })}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {displayProduct.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    aria-label="Add to wishlist" 
                    onClick={() => addToWishlist({ 
                      id: displayProduct.id, 
                      name: displayProduct.name, 
                      price: currentPrice, 
                      image: productImages[0], 
                      category: displayProduct.category?.name || 'Uncategorized', 
                      vendor: vendorName
                    })}
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-xs">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs">Warranty</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <span className="text-xs">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {displayProduct.description || displayProduct.shortDescription || 'No description available.'}
              </p>
              
              {features.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div>
              {Object.keys(specifications).length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Specifications</h2>
                  <div className="space-y-3">
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium">{key}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {displayProduct.brand && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Brand</h3>
                  <p className="text-muted-foreground">{displayProduct.brand}</p>
                </div>
              )}
              
              {displayProduct.sku && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">SKU</h3>
                  <p className="text-muted-foreground font-mono">{displayProduct.sku}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <ReviewsSection productId={displayProduct.id} />
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}