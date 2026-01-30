'use client'

/**
 * Demo page to showcase the premium product card design
 */

import { useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Eye, Heart, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/container"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// Mock product data for demonstration
const mockProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 4999,
    salePrice: 3999,
    ratingAverage: 4.5,
    ratingCount: 128,
    images: '/placeholder-product.jpg',
    category: { name: 'Electronics', slug: 'electronics' },
    vendor: { displayName: 'TechGear Ethiopia', isVendor: true },
    stockQuantity: 15,
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 8999,
    salePrice: null,
    ratingAverage: 4.8,
    ratingCount: 256,
    images: '/placeholder-product.jpg',
    category: { name: 'Wearables', slug: 'wearables' },
    vendor: { displayName: 'Smart Devices', isVendor: true },
    stockQuantity: 3,
  },
  {
    id: '3',
    name: 'Laptop Stand Adjustable',
    price: 1299,
    salePrice: null,
    ratingAverage: 4.2,
    ratingCount: 89,
    images: '/placeholder-product.jpg',
    category: { name: 'Accessories', slug: 'accessories' },
    vendor: { displayName: 'Office Solutions', isVendor: false },
    stockQuantity: 50,
  },
  {
    id: '4',
    name: 'USB-C Hub 7-in-1',
    price: 2499,
    salePrice: 1999,
    ratingAverage: 4.6,
    ratingCount: 342,
    images: '/placeholder-product.jpg',
    category: { name: 'Accessories', slug: 'accessories' },
    vendor: { displayName: 'ConnectTech', isVendor: true },
    stockQuantity: 25,
  },
  {
    id: '5',
    name: 'Mechanical Keyboard RGB',
    price: 6999,
    salePrice: null,
    ratingAverage: 4.9,
    ratingCount: 512,
    images: '/placeholder-product.jpg',
    category: { name: 'Gaming', slug: 'gaming' },
    vendor: { displayName: 'GamePro ET', isVendor: true },
    stockQuantity: 8,
  },
  {
    id: '6',
    name: 'Wireless Mouse Ergonomic',
    price: 1899,
    salePrice: 1499,
    ratingAverage: 4.3,
    ratingCount: 176,
    images: '/placeholder-product.jpg',
    category: { name: 'Accessories', slug: 'accessories' },
    vendor: { displayName: 'Tech Accessories', isVendor: true },
    stockQuantity: 2,
  },
  {
    id: '7',
    name: 'Portable SSD 1TB',
    price: 12999,
    salePrice: null,
    ratingAverage: 4.7,
    ratingCount: 234,
    images: '/placeholder-product.jpg',
    category: { name: 'Storage', slug: 'storage' },
    vendor: { displayName: 'Data Solutions', isVendor: true },
    stockQuantity: 12,
  },
  {
    id: '8',
    name: 'Webcam 4K HD',
    price: 5999,
    salePrice: 4799,
    ratingAverage: 4.4,
    ratingCount: 198,
    images: '/placeholder-product.jpg',
    category: { name: 'Electronics', slug: 'electronics' },
    vendor: { displayName: 'VideoTech', isVendor: false },
    stockQuantity: 18,
  },
]

export default function DemoCards() {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString()}`
  }

  const getBlurDataURL = () => {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Container className="py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Premium Product Card Design</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Redesigned product cards with modern aesthetics, enhanced shadows, smooth animations, and professional layout
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.map((product) => {
            const imageUrl = product.images || '/placeholder-product.jpg'
            const effectivePrice = product.salePrice || product.price
            const vendorName = product.vendor?.displayName || 'Unknown Vendor'
            const blur = getBlurDataURL()

            return (
              <div
                key={product.id}
                className="group bg-white dark:bg-card rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Mobile: square ratio */}
                <div className="block md:hidden">
                  <AspectRatio ratio={1}>
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
                          <Button size="icon" variant="secondary" className="bg-white hover:bg-gray-100 shadow-xl rounded-full h-11 w-11" aria-label="View product">
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="bg-primary hover:bg-primary/90 shadow-xl rounded-full h-11 w-11" 
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
                          <Button size="icon" variant="secondary" className="bg-white hover:bg-gray-100 shadow-xl rounded-full h-12 w-12" aria-label="View product">
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="bg-primary hover:bg-primary/90 shadow-xl rounded-full h-12 w-12" 
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
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="border-2 hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all"
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
      </Container>
      <Footer />
    </div>
  )
}
