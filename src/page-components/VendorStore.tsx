'use client'

/**
 * Vendor Store Page
 * 
 * Displays a vendor's profile and all their active products.
 * Supports pagination and sorting.
 */

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Star, ShoppingCart, Eye, Heart, MapPin, Calendar, CheckCircle, ArrowLeft, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ErrorBoundary } from "@/components/error-boundary"
import { ProductCardSkeleton } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBlurDataURL } from "@/lib/image-utils"
import { SellerRatingsDisplay } from "@/components/seller-ratings"

interface VendorProfile {
  id: string
  displayName: string | null
  firstName: string | null
  lastName: string | null
  city: string | null
  bio: string | null
  avatarUrl: string | null
  vendorStatus: string
  isVendor: boolean
  createdAt: string
}

interface Product {
  id: string
  name: string
  price: number
  salePrice: number | null
  ratingAverage: number
  ratingCount: number
  images: string[]
  stockQuantity: number
  category: {
    id: string
    name: string
    slug: string
  } | null
}

interface Pagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

interface VendorStoreData {
  vendor: VendorProfile
  products: Product[]
  pagination: Pagination
}

function VendorStoreContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const vendorId = params?.id as string
  
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  
  const [storeData, setStoreData] = useState<VendorStoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get current page and sort from URL
  const currentPage = parseInt(searchParams.get('page') || '1')
  const currentSort = searchParams.get('sort') || 'newest'

  // Fetch vendor store data
  useEffect(() => {
    const fetchVendorStore = async () => {
      if (!vendorId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        params.set('page', currentPage.toString())
        params.set('per_page', '20')
        params.set('sort', currentSort)
        
        const response = await fetch(`/api/vendors/store/${vendorId}?${params.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          setStoreData(data)
        } else if (response.status === 404) {
          setError('Vendor store not found')
        } else {
          setError('Failed to load vendor store')
        }
      } catch (err) {
        console.error('Error fetching vendor store:', err)
        setError('An error occurred while loading the vendor store')
      } finally {
        setLoading(false)
      }
    }
    
    fetchVendorStore()
  }, [vendorId, currentPage, currentSort])

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.set('page', '1') // Reset to page 1 when sorting changes
    router.push(`/vendor/store/${vendorId}?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/vendor/store/${vendorId}?${params.toString()}`)
  }

  const handleAddToCart = (product: Product) => {
    const images = parseImages(product.images)
    const price = product.salePrice || product.price
    
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(String(price)),
      image: images[0] || '/placeholder-product.jpg',
      quantity: 1
    })
    toast.success("Added to cart!")
  }

  const handleAddToWishlist = (product: Product) => {
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return
    }
    
    const images = parseImages(product.images)
    const price = product.salePrice || product.price
    
    addToWishlist({
      id: product.id,
      name: product.name,
      price: parseFloat(String(price)),
      image: images[0] || '/placeholder-product.jpg'
    })
    toast.success("Added to wishlist!")
  }

  // Parse images from product
  const parseImages = (images: string[] | string | null | undefined): string[] => {
    if (!images) return []
    if (Array.isArray(images)) return images
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const getVendorName = (vendor: VendorProfile) => {
    return vendor.displayName || 
           `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 
           'Unknown Vendor'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Container className="py-8">
          {/* Vendor Profile Skeleton */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto md:mx-0" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto md:mx-0" />
              </div>
            </div>
          </div>
          
          {/* Products Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ProductCardSkeleton count={8} />
          </div>
        </Container>
        <Footer />
      </div>
    )
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Container className="py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <ErrorState 
            message={error || 'Vendor store not found'}
            onRetry={() => window.location.reload()}
          />
        </Container>
        <Footer />
      </div>
    )
  }

  const { vendor, products, pagination } = storeData
  const vendorName = getVendorName(vendor)
  const isVerified = vendor.vendorStatus === 'approved'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Container className="py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Vendor Profile Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {vendor.avatarUrl ? (
                <Image
                  src={vendor.avatarUrl}
                  alt={vendorName}
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{vendorName}</h1>
                {isVerified && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Verified Seller
                  </Badge>
                )}
              </div>
              
              {vendor.bio && (
                <p className="text-muted-foreground mb-3 max-w-2xl">
                  {vendor.bio}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                {vendor.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(vendor.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  <span>{pagination.total} {pagination.total === 1 ? 'product' : 'products'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Ratings Section */}
        <div className="mb-8">
          <SellerRatingsDisplay vendorId={vendorId} maxRatings={5} />
        </div>

        {/* Products Section */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            All Products ({pagination.total})
          </h2>
          
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {products.length === 0 ? (
          <EmptyState 
            variant="products"
            title="No Products Yet"
            description="This vendor hasn't listed any products yet. Check back later!"
          />
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const images = parseImages(product.images)
                const firstImage = images[0] || '/placeholder-product.jpg'
                const price = parseFloat(String(product.salePrice || product.price))
                const originalPrice = product.salePrice ? parseFloat(String(product.price)) : null
                const rating = parseFloat(String(product.ratingAverage || 0))
                
                return (
                  <div
                    key={product.id}
                    className="group relative bg-white dark:bg-card rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    {/* Mobile: 4:3 ratio */}
                    <div className="block md:hidden">
                      <AspectRatio ratio={4 / 3}>
                        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                          <Image
                            src={firstImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                            placeholder="blur"
                            blurDataURL={getBlurDataURL()}
                            className="object-contain p-4 group-hover:scale-110 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {originalPrice && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-red-500 shadow-lg font-semibold">
                                -{Math.round((1 - price / originalPrice) * 100)}% OFF
                              </Badge>
                            </div>
                          )}
                        </div>
                      </AspectRatio>
                    </div>

                    {/* Desktop: square ratio */}
                    <div className="hidden md:block">
                      <div className="aspect-square">
                        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                          <Image
                            src={firstImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                            placeholder="blur"
                            blurDataURL={getBlurDataURL()}
                            className="object-contain p-6 group-hover:scale-110 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {originalPrice && (
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-red-500 shadow-lg font-semibold px-3 py-1">
                                -{Math.round((1 - price / originalPrice) * 100)}% OFF
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-base line-clamp-2 leading-tight min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-sm text-muted-foreground font-medium mt-1">
                            {product.category.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground font-medium ml-2">
                          ({product.ratingCount || 0})
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          ETB {price.toLocaleString()}
                        </span>
                        {originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ETB {originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Stock indicator */}
                      {product.stockQuantity <= 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Out of Stock
                        </Badge>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          className="flex-1 bg-primary hover:bg-primary/90 font-semibold shadow-md hover:shadow-lg transition-all"
                          size="sm"
                          disabled={product.stockQuantity <= 0}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product); }}
                          variant="outline"
                          size="icon"
                          className="border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}`); }}
                          variant="outline"
                          size="icon"
                          className="border-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
      <Footer />
    </div>
  )
}

export default function VendorStore() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-background">
          <Navbar />
          <Container className="py-8">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto md:mx-0" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto md:mx-0" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ProductCardSkeleton count={8} />
            </div>
          </Container>
          <Footer />
        </div>
      }>
        <VendorStoreContent />
      </Suspense>
    </ErrorBoundary>
  )
}
