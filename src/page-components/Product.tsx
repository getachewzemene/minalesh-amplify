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
  const productId = params?.id as string || mockProduct.id
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isOffline, setIsOffline] = useState(false)
  const [isUsingCache, setIsUsingCache] = useState(false)
  const { addToCart, addToWishlist } = useShop()

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
      // Cache the mock product (or fetched product) for offline use
      const productToCache: Omit<CachedProduct, 'cachedAt'> = {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        originalPrice: mockProduct.originalPrice,
        rating: mockProduct.rating,
        reviews: mockProduct.reviews,
        image: mockProduct.images[0]?.src || '',
        category: mockProduct.category,
        vendor: mockProduct.vendor.name,
        isVerifiedVendor: mockProduct.vendor.isVerified,
        hasAR: true,
        description: mockProduct.description,
        stockQuantity: mockProduct.stockCount,
      }
      
      await cacheProduct(productToCache)
    }

    // Only cache if online (we're viewing fresh data)
    if (isOnline()) {
      cacheCurrentProduct()
    }
  }, [productId])

  // Check if we need to load from cache when offline
  useEffect(() => {
    const loadCachedProduct = async () => {
      if (!isOnline()) {
        const cached = await getCachedProduct(productId)
        if (cached) {
          setIsUsingCache(true)
          // In a real implementation, we would update the product state
          // with the cached data. Since we're using mock data here,
          // we just show the indicator.
        }
      } else {
        setIsUsingCache(false)
      }
    }

    loadCachedProduct()
  }, [productId, isOffline])

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
                  src={mockProduct.images[selectedImage].src}
                  alt={mockProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {mockProduct.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={`${mockProduct.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-2">
                  {mockProduct.category}
                </Badge>
                <h1 className="text-3xl font-bold mb-2">{mockProduct.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(mockProduct.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {mockProduct.rating} ({mockProduct.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(mockProduct.price)}
                  </span>
                  {mockProduct.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(mockProduct.originalPrice)}
                    </span>
                  )}
                  {mockProduct.originalPrice && (
                    <Badge variant="destructive">
                      {Math.round(((mockProduct.originalPrice - mockProduct.price) / mockProduct.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-gradient-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{mockProduct.vendor.name}</h3>
                      {mockProduct.vendor.isVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {mockProduct.vendor.rating} • {mockProduct.vendor.totalSales} sales
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {mockProduct.inStock ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">
                      In Stock ({mockProduct.stockCount} available)
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
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 text-sm">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
                    size="lg"
                    onClick={() => addToCart({ id: mockProduct.id, name: mockProduct.name, price: mockProduct.price, image: mockProduct.images[0].src, category: mockProduct.category, vendor: mockProduct.vendor.name, hasAR: true })}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="lg" aria-label="Add to wishlist" onClick={() => addToWishlist({ id: mockProduct.id, name: mockProduct.name, price: mockProduct.price, image: mockProduct.images[0].src, category: mockProduct.category, vendor: mockProduct.vendor.name, hasAR: true })}>
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

          {/* AR Viewer */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Try It On</h2>
            <ARViewer 
              productType={mockProduct.productType}
              productName={mockProduct.name}
            />
          </div>

          {/* Product Details */}
          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {mockProduct.description}
              </p>
              
              <h3 className="text-lg font-semibold mt-6 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {mockProduct.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Specifications</h2>
              <div className="space-y-3">
                {Object.entries(mockProduct.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <ReviewsSection productId={mockProduct.id} />
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}