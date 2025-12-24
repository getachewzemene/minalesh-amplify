'use client'

import { useState, useEffect } from "react"
import { ShoppingCart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import { useShop } from "@/context/shop-context"
import { toast } from "sonner"
import Image from "next/image"
import { DEFAULTS } from "@/lib/product-constants"

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number | null
  images: string[]
  stockQuantity: number
}

interface FrequentlyBoughtTogetherProps {
  currentProductId: string
  currentProduct: {
    id: string
    name: string
    price: number
    image: string
  }
}

export function FrequentlyBoughtTogether({ currentProductId, currentProduct }: FrequentlyBoughtTogetherProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set([currentProductId]))
  const [loading, setLoading] = useState(true)
  const { addToCart } = useShop()

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`/api/products/${currentProductId}/frequently-bought-together`)
        if (response.ok) {
          const data = await response.json()
          setRelatedProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [currentProductId])

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (productId === currentProductId) return // Can't deselect current product
    
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const calculateTotal = () => {
    let total = 0
    if (selectedProducts.has(currentProductId)) {
      total += currentProduct.price
    }
    relatedProducts.forEach(product => {
      if (selectedProducts.has(product.id)) {
        total += product.salePrice || product.price
      }
    })
    return total
  }

  const addSelectedToCart = () => {
    let addedCount = 0
    
    if (selectedProducts.has(currentProductId)) {
      addToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image
      })
      addedCount++
    }

    relatedProducts.forEach(product => {
      if (selectedProducts.has(product.id)) {
        const imageUrl = product.images?.[0] || DEFAULTS.PLACEHOLDER_IMAGE
        addToCart({
          id: product.id,
          name: product.name,
          price: product.salePrice || product.price,
          image: imageUrl
        })
        addedCount++
      }
    })

    toast.success(`${addedCount} item${addedCount > 1 ? 's' : ''} added to cart!`)
  }

  if (loading || relatedProducts.length === 0) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Frequently Bought Together</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Product List */}
          <div className="flex flex-wrap gap-4 items-start">
            {/* Current Product */}
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
              <Checkbox 
                checked={selectedProducts.has(currentProductId)}
                disabled
                className="mt-1"
              />
              <div className="flex-1 flex gap-3">
                <div className="relative w-20 h-20 bg-muted rounded flex-shrink-0">
                  <Image
                    src={currentProduct.image}
                    alt={currentProduct.name}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{currentProduct.name}</h4>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatCurrency(currentProduct.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.slice(0, 3).map((product, index) => (
              <div key={product.id} className="flex items-center gap-2">
                {index === 0 && <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                     onClick={() => toggleProduct(product.id)}>
                  <Checkbox 
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 flex gap-3">
                    <div className="relative w-20 h-20 bg-muted rounded flex-shrink-0">
                      <Image
                        src={product.images?.[0] || DEFAULTS.PLACEHOLDER_IMAGE}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatCurrency(product.salePrice || product.price)}
                      </p>
                      {product.stockQuantity <= 0 && (
                        <span className="text-xs text-red-600">Out of stock</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total and Add to Cart */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total for {selectedProducts.size} items:</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</p>
            </div>
            <Button 
              onClick={addSelectedToCart}
              size="lg"
              disabled={selectedProducts.size === 0}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add Selected to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
