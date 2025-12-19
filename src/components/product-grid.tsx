'use client'

import { useState, useEffect } from "react"
import { Star, ShoppingCart, Eye, Heart, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "./ui/container"
import { useRouter } from "next/navigation"
import { useShop } from "@/context/shop-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { ProductCardSkeleton } from "@/components/ui/loading-state"
import { parsePrimaryImage, getEffectivePrice } from "@/lib/image-utils"

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  ratingAverage: number
  ratingCount: number
  images: any
  category?: {
    name: string
    slug: string
  }
  vendor?: {
    displayName?: string
    firstName?: string
    lastName?: string
    isVendor?: boolean
    city?: string
  }
  stockQuantity: number
}

export function ProductGrid() {
  const router = useRouter()
  const { addToCart, addToWishlist } = useShop()
  const { user } = useAuth()
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [category, setCategory] = useState<string>("All")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(["All"])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('limit', '12')
        if (category !== 'All') {
          params.append('category', category)
        }

        const response = await fetch(`/api/products/featured?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(data.products.map((p: Product) => p.category?.name).filter(Boolean))
          ) as string[]
          setCategories(['All', ...uniqueCategories])
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [category])

  const handleAddToCart = (product: Product) => {
    const imageUrl = parsePrimaryImage(product.images) || '/placeholder-product.jpg'
    const price = getEffectivePrice(product)

    addToCart({ 
      id: product.id, 
      name: product.name, 
      price, 
      image: imageUrl,
      category: product.category?.name || 'Uncategorized',
      vendor: product.vendor?.displayName || 
              `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 
              'Unknown Vendor',
    })
    toast.success("Item added to cart")
  }

  const handleAddToWishlist = (product: Product) => {
    const imageUrl = parsePrimaryImage(product.images) || '/placeholder-product.jpg'
    const price = getEffectivePrice(product)

    addToWishlist({ 
      id: product.id, 
      name: product.name, 
      price,
      image: imageUrl,
      category: product.category?.name || 'Uncategorized',
      vendor: product.vendor?.displayName || 
              `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 
              'Unknown Vendor',
    })
    toast.success("Item added to wishlist")
  }

  if (loading) {
    return (
      <section id="products" className="py-16 bg-background">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the latest electronics and trending items from verified vendors across Ethiopia
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCardSkeleton count={8} />
          </div>
        </Container>
      </section>
    )
  }

  if (!products.length) {
    return (
      <section id="products" className="py-16 bg-background">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No featured products available at the moment. Check back soon!
            </p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section id="products" className="py-16 bg-background">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the latest electronics and trending items from verified vendors across Ethiopia
          </p>
          <div className="mt-6 flex items-center justify-center">
            <label htmlFor="category" className="sr-only">Filter by category</label>
            <select
              id="category"
              className="px-3 py-2 rounded-md border bg-background"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter products by category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const imageUrl = parsePrimaryImage(product.images) || '/placeholder-product.jpg'
            const effectivePrice = getEffectivePrice(product)
            const vendorName = product.vendor?.displayName || 
                               `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 
                               'Unknown Vendor'

            return (
              <div
                key={product.id}
                className="bg-card rounded-lg shadow-card border transition-all duration-300 hover:shadow-gold hover:scale-105 cursor-pointer"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => router.push(`/product/${product.id}`)}
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.salePrice && product.salePrice < product.price && (
                      <Badge variant="destructive">
                        Sale
                      </Badge>
                    )}
                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <Badge className="bg-orange-500">
                        Low Stock
                      </Badge>
                    )}
                  </div>

                  {/* Hover actions */}
                  {hoveredProduct === product.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity duration-300">
                      <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}`) }} aria-label="View product">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        className="bg-primary hover:bg-primary/90" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {product.category && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category.name}
                      </Badge>
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(Number(product.ratingAverage))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.ratingCount})
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(effectivePrice)}
                      </span>
                      {product.salePrice && product.salePrice < product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        by {vendorName}
                      </span>
                      {product.vendor?.isVendor && (
                        <ShieldCheck className="h-3 w-3 text-green-500 ml-1" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToWishlist(product);
                      }}
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" onClick={(e) => {
            e.preventDefault();
            router.push("/products")
          }}>
            View All Products
          </Button>
        </div>
      </Container>
    </section>
  )
}