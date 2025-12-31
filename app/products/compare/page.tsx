'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Check, X, Star, ShoppingCart, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useShop } from '@/context/shop-context'

interface ProductComparisonData {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number | null
  discount: number | null
  stock: number
  category: string
  vendor: {
    name: string
    verified: boolean
  }
  image: string | null
  rating: number
  reviewCount: number
  specifications: Record<string, string> | null
  features: string[] | null
  shipping: {
    weight: number | null
    dimensions: string | null
  }
}

export default function ProductComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToCart } = useShop()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductComparisonData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const productIds = searchParams.get('ids')
    if (productIds) {
      fetchComparisonData(productIds)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const fetchComparisonData = async (productIds: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/compare/details?productIds=${productIds}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      } else {
        throw new Error('Failed to load comparison data')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product comparison',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: ProductComparisonData) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '/placeholder.png',
      quantity: 1,
      stock: product.stock,
    })
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`,
    })
  }

  const handleRemoveProduct = (productId: string) => {
    const remainingProducts = products.filter(p => p.id !== productId)
    if (remainingProducts.length < 2) {
      toast({
        title: 'Cannot Remove',
        description: 'You need at least 2 products to compare',
        variant: 'destructive',
      })
      return
    }
    setProducts(remainingProducts)
    const newIds = remainingProducts.map(p => p.id).join(',')
    router.push(`/products/compare?ids=${newIds}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">No Products to Compare</h2>
        <p className="text-muted-foreground mb-8">
          Add products to your comparison list to see them here
        </p>
        <Button onClick={() => router.push('/products')}>
          Browse Products
        </Button>
      </div>
    )
  }

  // Extract all unique specification keys
  const allSpecKeys = new Set<string>()
  products.forEach(product => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach(key => allSpecKeys.add(key))
    }
  })

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Product Comparison</h1>
          <p className="text-muted-foreground">
            Comparing {products.length} products
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Product Cards */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(300px, 1fr))` }}>
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="aspect-square relative mb-4">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                        No Image
                      </div>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{product.price} ETB</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice} ETB
                        </span>
                      )}
                    </div>
                    {product.discount && (
                      <Badge variant="destructive" className="mt-1">
                        {product.discount}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Vendor */}
                  <div>
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.vendor.name}</p>
                      {product.vendor.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Specifications Comparison */}
          {allSpecKeys.size > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(allSpecKeys).map((specKey) => (
                    <div key={specKey} className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${products.length}, minmax(300px, 1fr))` }}>
                      <div className="font-medium py-2 px-4 bg-muted rounded">
                        {specKey}
                      </div>
                      {products.map((product) => (
                        <div key={product.id} className="py-2 px-4 border rounded">
                          {product.specifications?.[specKey] || '-'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Comparison */}
          {products.some(p => p.features && p.features.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(300px, 1fr))` }}>
                  {products.map((product) => (
                    <div key={product.id} className="space-y-2">
                      {product.features && product.features.length > 0 ? (
                        product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No features listed</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
