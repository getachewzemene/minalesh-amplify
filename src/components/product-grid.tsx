'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
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
import { parsePrimaryImage, getEffectivePrice, getBlurDataURL } from "@/lib/image-utils"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { QuickViewModal } from "@/components/product/QuickViewModal"

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
  const [quickViewProduct, setQuickViewProduct] = useState<string | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)

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
            const blur = getBlurDataURL()

            return (
              <div
                key={product.id}
                className="group bg-white dark:bg-card rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => router.push(`/product/${product.id}`)}
              >
                {/* Mobile: 4:3 ratio */}
                <div className="block md:hidden">
                  <AspectRatio ratio={4 / 3}>
                    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        placeholder="blur"
                        blurDataURL={blur}
                        className="object-contain p-4 transition-all duration-500 group-hover:scale-110"
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.salePrice && product.salePrice < product.price && (
                          <Badge variant="destructive" className="shadow-lg font-semibold">
                            SALE
                          </Badge>
                        )}
                        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                          <Badge className="bg-orange-500 shadow-lg font-semibold">
                            Low Stock
                          </Badge>
                        )}
                      </div>

                      {/* Hover actions */}
                      {hoveredProduct === product.id && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-500">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="bg-white hover:bg-gray-100 shadow-xl rounded-full h-11 w-11" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setQuickViewProduct(product.id);
                              setQuickViewOpen(true);
                            }} 
                            aria-label="Quick view"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="bg-primary hover:bg-primary/90 shadow-xl rounded-full h-11 w-11" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            aria-label="Add to cart"
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AspectRatio>
                </div>

                {/* Desktop: square ratio with full-cover image */}
                <div className="hidden md:block">
                  <AspectRatio ratio={1}>
                    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        placeholder="blur"
                        blurDataURL={blur}
                        className="object-contain p-6 transition-all duration-500 group-hover:scale-110"
                        priority={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.salePrice && product.salePrice < product.price && (
                          <Badge variant="destructive" className="shadow-lg font-semibold px-3 py-1">
                            SALE
                          </Badge>
                        )}
                        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                          <Badge className="bg-orange-500 shadow-lg font-semibold px-3 py-1">
                            Low Stock
                          </Badge>
                        )}
                      </div>

                      {/* Hover actions */}
                      {hoveredProduct === product.id && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-500">
                          <Button size="icon" variant="secondary" className="bg-white hover:bg-gray-100 shadow-xl rounded-full h-12 w-12" onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}`) }} aria-label="View product">
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="bg-primary hover:bg-primary/90 shadow-xl rounded-full h-12 w-12" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            aria-label="Add to cart"
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AspectRatio>
                </div>

                <div className="p-5">
                  {product.category && (
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs font-medium border-primary/20 text-primary">
                        {product.category.name}
                      </Badge>
                    </div>
                  )}
                  
                  <h3 className="font-bold text-base text-card-foreground mb-3 line-clamp-2 leading-tight min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(Number(product.ratingAverage))
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium ml-1">
                      ({product.ratingCount})
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(effectivePrice)}
                      </span>
                      {product.salePrice && product.salePrice < product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-2 gap-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        by {vendorName}
                      </span>
                      {product.vendor?.isVendor && (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
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
                      className="border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all"
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

      {/* Quick View Modal */}
      <QuickViewModal 
        productId={quickViewProduct}
        isOpen={quickViewOpen}
        onClose={() => {
          setQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />
    </section>
  )
}