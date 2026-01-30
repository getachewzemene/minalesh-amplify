'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, GitCompare, Star } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  images?: string[]
  ratingAverage: number
  brand?: string
  features?: string[]
  specifications?: Record<string, any>
}

const COMPARISON_KEY = 'productComparison'
const MAX_COMPARE = 4

export function ProductComparison() {
  const [compareProducts, setCompareProducts] = useState<Product[]>([])

  useEffect(() => {
    // Load comparison products from localStorage
    const stored = localStorage.getItem(COMPARISON_KEY)
    if (stored) {
      try {
        setCompareProducts(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading comparison products:', error)
      }
    }
  }, [])

  const removeProduct = (productId: string) => {
    const updated = compareProducts.filter(p => p.id !== productId)
    setCompareProducts(updated)
    localStorage.setItem(COMPARISON_KEY, JSON.stringify(updated))
    toast.success('Product removed from comparison')
  }

  const clearAll = () => {
    setCompareProducts([])
    localStorage.removeItem(COMPARISON_KEY)
    toast.success('Comparison cleared')
  }

  if (compareProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Product Comparison
          </CardTitle>
          <CardDescription>Compare products side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products to compare</p>
            <p className="text-sm mt-2">Add products from product pages to compare them</p>
            <Button className="mt-4" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Product Comparison ({compareProducts.length})
            </CardTitle>
            <CardDescription>Compare up to {MAX_COMPARE} products</CardDescription>
          </div>
          <div className="flex gap-2">
            {compareProducts.length >= 2 && (
              <Button asChild>
                <Link href={`/compare?ids=${compareProducts.map(p => p.id).join(',')}`}>
                  View Full Comparison
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-4 text-left bg-muted/50 font-medium">Product</th>
                {compareProducts.map(product => (
                  <th key={product.id} className="border p-4 min-w-[200px]">
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="aspect-square bg-muted rounded-md overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{product.name}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-4 font-medium bg-muted/50">Price</td>
                {compareProducts.map(product => (
                  <td key={product.id} className="border p-4 text-center">
                    <div className="space-y-1">
                      {product.salePrice ? (
                        <>
                          <p className="text-lg font-bold text-primary">{product.salePrice} ETB</p>
                          <p className="text-sm text-muted-foreground line-through">{product.price} ETB</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-primary">{product.price} ETB</p>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="border p-4 font-medium bg-muted/50">Rating</td>
                {compareProducts.map(product => (
                  <td key={product.id} className="border p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.ratingAverage || 'N/A'}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {compareProducts.some(p => p.brand) && (
                <tr>
                  <td className="border p-4 font-medium bg-muted/50">Brand</td>
                  {compareProducts.map(product => (
                    <td key={product.id} className="border p-4 text-center">
                      {product.brand || '-'}
                    </td>
                  ))}
                </tr>
              )}

              <tr>
                <td className="border p-4 font-medium bg-muted/50">Features</td>
                {compareProducts.map(product => (
                  <td key={product.id} className="border p-4">
                    {product.features && product.features.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {product.features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="border p-4 font-medium bg-muted/50">Actions</td>
                {compareProducts.map(product => (
                  <td key={product.id} className="border p-4">
                    <div className="flex flex-col gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/product/${product.slug}`}>View Details</Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        Add to Cart
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to add product to comparison (can be called from product pages)
export function addToComparison(product: Product) {
  const stored = localStorage.getItem(COMPARISON_KEY)
  let products: Product[] = stored ? JSON.parse(stored) : []
  
  // Check if already in comparison
  if (products.some(p => p.id === product.id)) {
    toast.info('Product already in comparison')
    return false
  }

  // Check max limit
  if (products.length >= MAX_COMPARE) {
    toast.error(`You can only compare up to ${MAX_COMPARE} products at a time`)
    return false
  }

  products.push(product)
  localStorage.setItem(COMPARISON_KEY, JSON.stringify(products))
  toast.success('Product added to comparison')
  return true
}

// Helper function to check if product is in comparison
export function isInComparison(productId: string): boolean {
  const stored = localStorage.getItem(COMPARISON_KEY)
  if (!stored) return false
  
  try {
    const products: Product[] = JSON.parse(stored)
    return products.some(p => p.id === productId)
  } catch {
    return false
  }
}
