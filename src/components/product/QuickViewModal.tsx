'use client'

import { useState, useEffect } from "react"
import { X, ShoppingCart, Heart, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { useShop } from "@/context/shop-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  ratingAverage: number
  ratingCount: number
  images: string[]
  shortDescription?: string
  stockQuantity: number
  category?: { name: string }
  vendor?: { displayName?: string }
}

interface QuickViewModalProps {
  productId: string | null
  isOpen: boolean
  onClose: () => void
}

export function QuickViewModal({ productId, isOpen, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addToCart, addToWishlist } = useShop()
  const router = useRouter()

  useEffect(() => {
    if (productId && isOpen) {
      fetchProduct()
    }
  }, [productId, isOpen])

  const fetchProduct = async () => {
    if (!productId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
        setSelectedImage(0)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    const imageUrl = product.images?.[0] || '/placeholder-product.jpg'
    const price = product.salePrice || product.price
    
    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: imageUrl
    })
    toast.success("Added to cart!")
  }

  const handleAddToWishlist = () => {
    if (!product) return
    
    const imageUrl = product.images?.[0] || '/placeholder-product.jpg'
    const price = product.salePrice || product.price
    
    addToWishlist({
      id: product.id,
      name: product.name,
      price,
      image: imageUrl
    })
    toast.success("Added to wishlist!")
  }

  const handleViewFullDetails = () => {
    if (product) {
      router.push(`/product/${product.id}`)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : product ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Images */}
            <div className="space-y-3">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                <Image
                  src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="relative w-full h-full bg-muted">
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-contain p-1"
                          sizes="100px"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-2xl pr-8">{product.name}</DialogTitle>
                </DialogHeader>
                
                {product.category && (
                  <Badge variant="outline" className="mt-2">
                    {product.category.name}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.ratingAverage)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.ratingAverage.toFixed(1)} ({product.ratingCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.salePrice || product.price)}
                </span>
                {product.salePrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant="destructive">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">In Stock</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.shortDescription && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.shortDescription}
                </p>
              )}

              {/* Vendor */}
              {product.vendor?.displayName && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Sold by: </span>
                  <span className="font-medium">{product.vendor.displayName}</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddToCart}
                    disabled={product.stockQuantity <= 0}
                    className="flex-1"
                    size="lg"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleAddToWishlist}
                    variant="outline"
                    size="lg"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleViewFullDetails}
                  variant="outline"
                  className="w-full"
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Product not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
