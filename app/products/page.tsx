'use client'

/**
 * Products Page
 * 
 * Implements server-side search and filtering through the /api/products/search endpoint.
 * Products are fetched dynamically based on URL parameters from the AdvancedSearch component.
 */

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Star, ShoppingCart, Eye, Heart } from "lucide-react"
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
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import phoneImg from "@/assets/products/phone.jpg"
import sunglassesImg from "@/assets/products/sunglasses.jpg"
import earbudsImg from "@/assets/products/earbuds.jpg"
import capImg from "@/assets/products/cap.jpg"
import laptopImg from "@/assets/products/laptop.jpg"
import headphonesImg from "@/assets/products/headphones.jpg"
import shoesImg from "@/assets/products/shoes.jpg"
import jeansImg from "@/assets/products/jeans.jpg"
import cctvImg from "@/assets/products/cctv.jpg"
import nightlightImg from "@/assets/products/nightlight.jpg"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: any
  category: string
  hasAR?: boolean
  vendor: string
  isVerifiedVendor?: boolean
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: 89999,
    originalPrice: 94999,
    rating: 4.8,
    reviews: 256,
    image: phoneImg,
    category: "Smartphones",
    vendor: "TechStore ET",
    isVerifiedVendor: true
  },
  {
    id: "2",
    name: "Ray-Ban Aviator",
    price: 4299,
    rating: 4.5,
    reviews: 128,
    image: sunglassesImg,
    category: "Accessories",
    vendor: "Fashion Hub",
    isVerifiedVendor: true,
    hasAR: true
  },
  {
    id: "3",
    name: "AirPods Pro",
    price: 7999,
    originalPrice: 8999,
    rating: 4.7,
    reviews: 312,
    image: earbudsImg,
    category: "Electronics",
    vendor: "TechStore ET",
    isVerifiedVendor: true
  },
  {
    id: "4",
    name: "Nike Sport Cap",
    price: 899,
    rating: 4.3,
    reviews: 89,
    image: capImg,
    category: "Sports",
    vendor: "Sports Corner"
  },
  {
    id: "5",
    name: "MacBook Pro 16\"",
    price: 129999,
    rating: 4.9,
    reviews: 421,
    image: laptopImg,
    category: "Computers",
    vendor: "TechStore ET",
    isVerifiedVendor: true
  },
  {
    id: "6",
    name: "Sony WH-1000XM5",
    price: 12999,
    rating: 4.8,
    reviews: 267,
    image: headphonesImg,
    category: "Electronics",
    vendor: "AudioMax"
  },
  {
    id: "7",
    name: "Nike Air Max",
    price: 5999,
    rating: 4.6,
    reviews: 189,
    image: shoesImg,
    category: "Shoes",
    vendor: "Sports Corner",
    hasAR: true
  },
  {
    id: "8",
    name: "Levi's 501 Jeans",
    price: 2499,
    originalPrice: 3299,
    rating: 4.4,
    reviews: 156,
    image: jeansImg,
    category: "Clothing",
    vendor: "Fashion Hub"
  },
  {
    id: "9",
    name: "4K CCTV Security Camera System",
    price: 8999,
    originalPrice: 9999,
    rating: 4.7,
    reviews: 142,
    image: cctvImg,
    category: "Security & Surveillance",
    vendor: "SecureTech ET",
    isVerifiedVendor: true
  },
  {
    id: "10",
    name: "Wireless Security Camera Set",
    price: 12499,
    rating: 4.8,
    reviews: 98,
    image: cctvImg,
    category: "Security & Surveillance",
    vendor: "SecureTech ET",
    isVerifiedVendor: true
  },
  {
    id: "11",
    name: "3D LED Night Light Moon Lamp",
    price: 599,
    rating: 4.8,
    reviews: 215,
    image: nightlightImg,
    category: "Gifts & Decor",
    hasAR: true,
    vendor: "Gift Haven",
    isVerifiedVendor: false
  },
  {
    id: "12",
    name: "3D Galaxy Night Light Projector",
    price: 899,
    originalPrice: 1199,
    rating: 4.6,
    reviews: 167,
    image: nightlightImg,
    category: "Gifts & Decor",
    hasAR: true,
    vendor: "Gift Haven",
    isVerifiedVendor: false
  }
]

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch products when search parameters change
  useEffect(() => {
    const fetchProducts = async () => {
      // Build query string from search params
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => {
        params.append(key, value)
      })
      
      // Only fetch if there are search parameters, otherwise use mock data
      if (params.toString()) {
        setLoading(true)
        setError(null)
        
        try {
          const response = await fetch(`/api/products/search?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            
            // Transform backend data to match Product interface
            const transformedProducts = data.products.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: parseFloat(p.price),
              originalPrice: p.salePrice ? parseFloat(p.salePrice) : undefined,
              rating: parseFloat(p.ratingAverage || 0),
              reviews: p.ratingCount || 0,
              image: p.images && Array.isArray(p.images) && p.images[0] ? { src: p.images[0] } : phoneImg,
              category: p.category?.name || 'Uncategorized',
              hasAR: false, // TODO: Add hasAR field to backend
              vendor: p.vendor?.displayName || 'Unknown',
              isVerifiedVendor: p.vendor?.vendorStatus === 'approved'
            }))
            
            setProducts(transformedProducts.length > 0 ? transformedProducts : mockProducts)
          } else {
            setError('Failed to fetch products')
            setProducts(mockProducts)
          }
        } catch (err) {
          console.error('Error fetching products:', err)
          setError('An error occurred while fetching products')
          setProducts(mockProducts)
        } finally {
          setLoading(false)
        }
      } else {
        // No search parameters, use mock data
        setProducts(mockProducts)
      }
    }
    
    fetchProducts()
  }, [searchParams])

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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">All Products</h1>
            <AdvancedSearch />
          </div>
          
          {loading && (
            <LoadingState message="Loading products..." />
          )}
          
          {error && (
            <ErrorState 
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
                // Retry logic here
              }}
            />
          )}
          
          {!loading && !error && (
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
        
        {!loading && !error && products.length === 0 && (
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        </Container>
        <Footer />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
