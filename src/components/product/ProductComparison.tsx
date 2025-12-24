'use client'

import { useState, useEffect } from "react"
import { X, Plus, Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  images: string[]
  brand?: string
  specifications?: Record<string, string>
  ratingAverage: number
  stockQuantity: number
  category?: { name: string }
}

interface ProductComparisonProps {
  isOpen: boolean
  onClose: () => void
  products: string[] // Product IDs
}

export function ProductComparison({ isOpen, onClose, products }: ProductComparisonProps) {
  const [productData, setProductData] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && products.length > 0) {
      fetchProducts()
    }
  }, [isOpen, products])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const promises = products.map(id => 
        fetch(`/api/products/${id}`).then(r => r.json()).then(d => d.product)
      )
      const data = await Promise.all(promises)
      setProductData(data.filter(Boolean))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get all unique specification keys
  const allSpecs = Array.from(
    new Set(
      productData.flatMap(p => 
        p.specifications ? Object.keys(p.specifications) : []
      )
    )
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Products</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : productData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products to compare</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-muted font-semibold">Feature</th>
                  {productData.map(product => (
                    <th key={product.id} className="p-4 bg-muted min-w-[200px]">
                      <div className="space-y-3">
                        <div className="relative aspect-square bg-background rounded overflow-hidden">
                          <Image
                            src={product.images?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                            sizes="200px"
                          />
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            router.push(`/product/${product.id}`)
                            onClose()
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr className="border-b">
                  <td className="p-4 font-medium">Price</td>
                  {productData.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-primary">
                          {formatCurrency(product.salePrice || product.price)}
                        </div>
                        {product.salePrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b">
                  <td className="p-4 font-medium">Rating</td>
                  {productData.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{product.ratingAverage.toFixed(1)}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr className="border-b">
                  <td className="p-4 font-medium">Availability</td>
                  {productData.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {product.stockQuantity > 0 ? (
                        <Badge className="bg-green-500">In Stock</Badge>
                      ) : (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Brand */}
                <tr className="border-b">
                  <td className="p-4 font-medium">Brand</td>
                  {productData.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {product.brand || '-'}
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b">
                  <td className="p-4 font-medium">Category</td>
                  {productData.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {product.category?.name || '-'}
                    </td>
                  ))}
                </tr>

                {/* Specifications */}
                {allSpecs.map(spec => (
                  <tr key={spec} className="border-b">
                    <td className="p-4 font-medium">{spec}</td>
                    {productData.map(product => (
                      <td key={product.id} className="p-4 text-center">
                        {product.specifications?.[spec] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to manage product comparison
 */
export function useProductComparison() {
  const [compareProducts, setCompareProducts] = useState<string[]>([])
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('compare_products')
    if (stored) {
      try {
        setCompareProducts(JSON.parse(stored))
      } catch (e) {
        console.error('Error loading comparison list:', e)
      }
    }
  }, [])

  const addToCompare = (productId: string) => {
    const newList = [...compareProducts, productId].slice(-4) // Max 4 products
    setCompareProducts(newList)
    localStorage.setItem('compare_products', JSON.stringify(newList))
  }

  const removeFromCompare = (productId: string) => {
    const newList = compareProducts.filter(id => id !== productId)
    setCompareProducts(newList)
    localStorage.setItem('compare_products', JSON.stringify(newList))
  }

  const clearCompare = () => {
    setCompareProducts([])
    localStorage.removeItem('compare_products')
  }

  const openCompare = () => setIsCompareOpen(true)
  const closeCompare = () => setIsCompareOpen(false)

  return {
    compareProducts,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    openCompare,
    closeCompare
  }
}
