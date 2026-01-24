"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Star, ShoppingCart, Heart, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useShop } from "@/context/shop-context"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { ProductCardSkeleton } from "@/components/ui/loading-state"
import { parsePrimaryImage, getEffectivePrice, getBlurDataURL } from "@/lib/image-utils"

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
  similarityScore?: number
}

interface SimilarProductsProps {
  productId: string
  limit?: number
}

export function SimilarProducts({ productId, limit = 8 }: SimilarProductsProps) {
  const router = useRouter()
  const { addToCart, addToWishlist } = useShop()
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/recommendations/similar/${productId}?limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching similar products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchSimilarProducts()
    }
  }, [productId, limit])

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
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Similar Products You May Like</h2>
            </div>
            <p className="text-muted-foreground">AI-powered recommendations based on this product</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCardSkeleton count={4} />
          </div>
        </div>
      </section>
    )
  }

  if (!products.length) {
    return null
  }

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Similar Products You May Like</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered recommendations based on category, price range, and features
          </p>
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
                {/* Mobile and Desktop view */}
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

                    {/* Hover actions - desktop only */}
                    {hoveredProduct === product.id && (
                      <div className="hidden md:flex absolute inset-0 bg-black/60 backdrop-blur-sm items-center justify-center gap-3 transition-all duration-500">
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
      </div>
    </section>
  )
}
