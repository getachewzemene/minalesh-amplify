'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, GitCompare, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"
import { ARViewer } from "@/components/ar-viewer"
import { ReviewsSection } from "@/components/reviews/ReviewsSection"
import { useShop } from "@/context/shop-context"
import { useComparison } from "@/context/comparison-context"
import { formatCurrency } from "@/lib/utils"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { 
  cacheProduct, 
  getCachedProduct, 
  isOnline,
  type CachedProduct 
} from "@/lib/offline-cache"
import { parseAllImages, getEffectivePrice, parseJsonField } from "@/lib/image-utils"
import { FrequentlyBoughtTogether } from "@/components/product/FrequentlyBoughtTogether"
import { ProductQA } from "@/components/product/ProductQA"
import { StockAlert } from "@/components/product/StockAlert"
import { RecentlyViewedProducts, trackProductView } from "@/components/product/RecentlyViewedProducts"
import { DeliveryEstimator } from "@/components/product/DeliveryEstimator"
import { PriceAlertButton } from "@/components/user/PriceAlertButton"
import { useAuth } from "@/context/auth-context"
import { VendorStatsCard } from "@/components/seller-ratings"
import { ProductSocialShare } from "@/components/social"
import { SubscribeAndSaveButton } from "@/components/subscriptions"
import { SimilarProducts } from "@/components/recommendations"

interface ProductData {
  id: string
  name: string
  price: number
  salePrice?: number | null
  ratingAverage: number
  ratingCount: number
  images: any
  category?: {
    id: string
    name: string
    slug: string
  }
  vendor?: {
    id: string
    displayName?: string
    firstName?: string
    lastName?: string
    isVendor?: boolean
    city?: string
    vendorStatus?: string
  }
  stockQuantity: number
  description?: string
  shortDescription?: string
  features?: string | string[]
  specifications?: string | Record<string, string>
  brand?: string
  sku?: string
}

export default function Product() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isOffline, setIsOffline] = useState(false)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const [displayProduct, setDisplayProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToCart, addToWishlist } = useShop()
  const { addToCompare, isInCompare, removeFromCompare, canAddMore } = useComparison()
  const { user } = useAuth()

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
          
          // Track this product view
          const productImages = parseAllImages(data.product.images)
          trackProductView({
            id: data.product.id,
            name: data.product.name,
            price: data.product.price,
            salePrice: data.product.salePrice,
            image: productImages[0] || '/placeholder-product.jpg'
          })
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

  // Cache product for offline viewing - only if displayProduct is loaded
  useEffect(() => {
    const cacheCurrentProduct = async () => {
      if (!displayProduct) return
      
      const productImages = parseAllImages(displayProduct.images)
      // Cache the current product for offline use
      const productToCache: Omit<CachedProduct, 'cachedAt'> = {
        id: displayProduct.id,
        name: displayProduct.name,
        price: displayProduct.price,
        originalPrice: displayProduct.salePrice ? displayProduct.price : undefined,
        rating: displayProduct.ratingAverage,
        reviews: displayProduct.ratingCount,
        image: productImages[0] || '',
        category: displayProduct.category?.name || '',
        vendor: displayProduct.vendor?.displayName || 
                `${displayProduct.vendor?.firstName || ''} ${displayProduct.vendor?.lastName || ''}`.trim(),
        isVerifiedVendor: displayProduct.vendor?.vendorStatus === 'approved',
        hasAR: true,
        description: displayProduct.description,
        stockQuantity: displayProduct.stockQuantity,
      }
      
      await cacheProduct(productToCache)
    }

    // Only cache if online (we're viewing fresh data)
    if (isOnline() && displayProduct) {
      cacheCurrentProduct()
    }
  }, [displayProduct])

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
  const firstImage = productImages[0] || '/placeholder-product.jpg'
  const vendorName = displayProduct.vendor?.displayName || 
                     `${displayProduct.vendor?.firstName || ''} ${displayProduct.vendor?.lastName || ''}`.trim() || 
                     'Unknown Vendor'
  const isVendorVerified = displayProduct.vendor?.vendorStatus === 'approved'
  const currentPrice = getEffectivePrice(displayProduct)
  const originalPrice = displayProduct.salePrice ? displayProduct.price : null

  // Parse features and specifications using shared utility
  const features = parseJsonField<string[]>(displayProduct.features, [])
  const specifications = parseJsonField<Record<string, string>>(displayProduct.specifications, {})

  return (
    <div className="min-h-screen bg-background pb-24">
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
              <div className="aspect-square overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                <img
                  src={productImages[selectedImage]}
                  alt={displayProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors bg-muted flex items-center justify-center ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${displayProduct.name} view ${index + 1}`}
                        className="w-full h-full object-contain"
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

              {/* Vendor Info with Seller Ratings */}
              {displayProduct.vendor?.id && (
                <div className="space-y-3">
                  <VendorStatsCard vendorId={displayProduct.vendor.id} compact />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (displayProduct.vendor?.id) {
                        router.push(`/vendor/store/${displayProduct.vendor.id}`)
                      }
                    }}
                  >
                    View Store
                  </Button>
                </div>
              )}

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

              {/* Stock Alert for Out of Stock Items */}
              <StockAlert 
                productId={displayProduct.id}
                productName={displayProduct.name}
                isInStock={displayProduct.stockQuantity > 0}
              />

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
                      image: firstImage, 
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
                      image: firstImage, 
                      category: displayProduct.category?.name || 'Uncategorized', 
                      vendor: vendorName
                    })}
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant={isInCompare(displayProduct.id) ? "default" : "outline"}
                    size="lg"
                    className={isInCompare(displayProduct.id) ? 'bg-green-600 hover:bg-green-700' : ''}
                    aria-label={isInCompare(displayProduct.id) ? "Remove from comparison" : "Add to comparison"}
                    onClick={() => {
                      if (isInCompare(displayProduct.id)) {
                        removeFromCompare(displayProduct.id)
                      } else {
                        addToCompare({
                          id: displayProduct.id,
                          name: displayProduct.name,
                          price: displayProduct.price,
                          salePrice: displayProduct.salePrice,
                          image: firstImage,
                          category: displayProduct.category?.name,
                          vendor: vendorName,
                          ratingAverage: displayProduct.ratingAverage,
                          stockQuantity: displayProduct.stockQuantity,
                          brand: displayProduct.brand,
                          specifications: parseJsonField<Record<string, string>>(displayProduct.specifications, {}),
                          features: parseJsonField<string[]>(displayProduct.features, [])
                        })
                      }
                    }}
                    disabled={!isInCompare(displayProduct.id) && !canAddMore}
                  >
                    {isInCompare(displayProduct.id) ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <GitCompare className="h-5 w-5" />
                    )}
                  </Button>
                  <PriceAlertButton
                    productId={displayProduct.id}
                    productName={displayProduct.name}
                    currentPrice={currentPrice}
                    isLoggedIn={!!user}
                    onLoginRequired={() => router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))}
                  />
                  <ProductSocialShare
                    productId={displayProduct.id}
                    productName={displayProduct.name}
                    productDescription={displayProduct.shortDescription || displayProduct.description}
                    productPrice={currentPrice}
                    productImage={firstImage}
                    showShareCount={true}
                  />
                </div>

                {/* Subscribe & Save Button */}
                {displayProduct.stockQuantity > 0 && (
                  <SubscribeAndSaveButton
                    productId={displayProduct.id}
                    productName={displayProduct.name}
                    price={currentPrice}
                    onSubscribed={() => {
                      // Optionally show success message or redirect
                      router.push('/subscriptions?tab=products')
                    }}
                  />
                )}
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

              {/* Delivery Estimator */}
              <DeliveryEstimator
                productId={displayProduct.id}
                vendorCity={displayProduct.vendor?.city}
                inStock={displayProduct.stockQuantity > 0}
              />
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

          {/* Frequently Bought Together */}
          <FrequentlyBoughtTogether 
            currentProductId={displayProduct.id}
            currentProduct={{
              id: displayProduct.id,
              name: displayProduct.name,
              price: currentPrice,
              image: firstImage
            }}
          />

          {/* Product Q&A */}
          <ProductQA productId={displayProduct.id} />

          {/* Similar Products */}
          <SimilarProducts productId={displayProduct.id} limit={8} />

          {/* Recently Viewed Products */}
          <RecentlyViewedProducts />
        </Container>
      </main>

      <Footer />
    </div>
  )
}