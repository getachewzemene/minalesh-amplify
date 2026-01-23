'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Check, Star, ShoppingCart, Trash2, GitCompare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useShop } from '@/context/shop-context'
import { useComparison } from '@/context/comparison-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Container } from '@/components/ui/container'
import { formatCurrency } from '@/lib/utils'
import { parseAllImages, getEffectivePrice, parseJsonField } from '@/lib/image-utils'

interface ProductComparisonData {
  id: string
  name: string
  description: string
  price: number
  salePrice?: number | null
  stockQuantity: number
  category?: { name: string }
  vendor?: {
    displayName?: string
    firstName?: string
    lastName?: string
    vendorStatus?: string
  }
  images: string | string[] | null
  ratingAverage: number
  ratingCount: number
  specifications?: string | Record<string, string> | null
  features?: string | string[] | null
  brand?: string
  sku?: string
}

// Helper to detect if a spec value differs among products
function hasSpecDifference(products: ProductComparisonData[], specKey: string): boolean {
  const specs = products.map(p => {
    const parsed = parseJsonField<Record<string, string>>(p.specifications, {})
    return parsed[specKey] || '-'
  })
  const uniqueValues = new Set(specs.filter(s => s !== '-'))
  return uniqueValues.size > 1
}

// Helper to check if products are from the same category
function isSameCategory(products: ProductComparisonData[]): boolean {
  if (products.length === 0) return true
  const categories = products.map(p => p.category?.name).filter(Boolean)
  return new Set(categories).size <= 1
}

// Helper to get category-specific attribute groups
function getCategorySpecificGroups(categoryName: string | undefined): Record<string, string[]> {
  if (!categoryName) return {}
  
  const categoryLower = categoryName.toLowerCase()
  
  // Define category-specific specification groups
  const categoryGroups: Record<string, Record<string, string[]>> = {
    'electronics': {
      'Display': ['Screen Size', 'Resolution', 'Display Type', 'Refresh Rate', 'Screen'],
      'Performance': ['Processor', 'CPU', 'RAM', 'Storage', 'GPU', 'Graphics'],
      'Camera': ['Main Camera', 'Front Camera', 'Camera Resolution', 'Video Recording'],
      'Battery': ['Battery Capacity', 'Charging Speed', 'Battery Life'],
      'Connectivity': ['WiFi', 'Bluetooth', '5G', 'NFC', 'USB'],
    },
    'phones': {
      'Display': ['Screen Size', 'Resolution', 'Display Type', 'Refresh Rate'],
      'Performance': ['Processor', 'RAM', 'Storage', 'GPU'],
      'Camera': ['Main Camera', 'Front Camera', 'Camera Resolution'],
      'Battery': ['Battery Capacity', 'Charging Speed'],
      'Connectivity': ['5G', 'WiFi', 'Bluetooth', 'NFC'],
    },
    'laptops': {
      'Display': ['Screen Size', 'Resolution', 'Panel Type'],
      'Performance': ['Processor', 'CPU', 'RAM', 'Storage', 'GPU', 'Graphics Card'],
      'Connectivity': ['WiFi', 'Bluetooth', 'USB Ports', 'HDMI'],
      'Battery': ['Battery Life', 'Battery Capacity'],
    },
    'clothing': {
      'Specifications': ['Size', 'Material', 'Color', 'Fabric'],
      'Details': ['Fit', 'Pattern', 'Sleeve Type', 'Collar Type'],
    },
    'shoes': {
      'Specifications': ['Size', 'Material', 'Color'],
      'Details': ['Sole Material', 'Closure Type', 'Heel Type'],
    },
    'furniture': {
      'Dimensions': ['Width', 'Height', 'Depth', 'Weight'],
      'Materials': ['Material', 'Finish', 'Color'],
      'Features': ['Assembly Required', 'Weight Capacity'],
    },
  }
  
  // Find matching category group
  for (const [key, groups] of Object.entries(categoryGroups)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return groups
    }
  }
  
  return {}
}

// Helper to get best/lowest price
function getBestPrice(products: ProductComparisonData[]): number {
  return Math.min(...products.map(p => p.salePrice || p.price))
}

// Helper to get best rating
function getBestRating(products: ProductComparisonData[]): number {
  return Math.max(...products.map(p => p.ratingAverage || 0))
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addToCart } = useShop()
  const { compareProducts: contextProducts, removeFromCompare, clearCompare, setCompareBarVisible } = useComparison()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductComparisonData[]>([])
  const [loading, setLoading] = useState(true)

  // Hide comparison bar on this page to avoid redundancy
  useEffect(() => {
    setCompareBarVisible(false)
    return () => setCompareBarVisible(true)
  }, [setCompareBarVisible])

  useEffect(() => {
    const productIds = searchParams.get('ids')
    if (productIds) {
      fetchComparisonData(productIds.split(','))
    } else if (contextProducts.length > 0) {
      // Use products from context if no URL params
      fetchComparisonData(contextProducts.map(p => p.id))
    } else {
      setLoading(false)
    }
  }, [searchParams, contextProducts])

  const fetchComparisonData = async (productIds: string[]) => {
    setLoading(true)
    try {
      const promises = productIds.map(id =>
        fetch(`/api/products/${id}`).then(r => r.json()).then(d => d.product)
      )
      const data = await Promise.all(promises)
      setProducts(data.filter(Boolean))
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
    const productImages = parseAllImages(product.images)
    const currentPrice = getEffectivePrice(product)
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: productImages[0] || '/placeholder-product.jpg',
    })
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`,
    })
  }

  const handleRemoveProduct = (productId: string) => {
    // Prevent removing the last product - need at least 1 to stay on comparison page
    if (products.length <= 1) {
      toast({
        title: 'Cannot Remove',
        description: 'This is the last product. Clear all to exit comparison.',
        variant: 'destructive',
      })
      return
    }
    removeFromCompare(productId)
    const remainingProducts = products.filter(p => p.id !== productId)
    setProducts(remainingProducts)
    const newIds = remainingProducts.map(p => p.id).join(',')
    router.push(`/compare?ids=${newIds}`)
  }

  const handleClearAll = () => {
    clearCompare()
    setProducts([])
    router.push('/products')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8">
          <Container>
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16">
          <Container>
            <div className="text-center py-16">
              <GitCompare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-2xl font-bold mb-4">No Products to Compare</h2>
              <p className="text-muted-foreground mb-8">
                Add products to your comparison list to see them here
              </p>
              <Button onClick={() => router.push('/products')}>
                Browse Products
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  // Extract all unique specification keys
  const allSpecKeys = new Set<string>()
  products.forEach(product => {
    const specs = parseJsonField<Record<string, string>>(product.specifications, {})
    Object.keys(specs).forEach(key => allSpecKeys.add(key))
  })

  // Check if all products are from the same category
  const sameCategory = isSameCategory(products)
  const categoryName = sameCategory && products.length > 0 ? products[0].category?.name : undefined
  
  // Get category-specific groups if applicable
  const categoryGroups = sameCategory ? getCategorySpecificGroups(categoryName) : {}
  const hasGroups = Object.keys(categoryGroups).length > 0

  // Organize specs by category-specific groups
  const organizedSpecs: Record<string, string[]> = {}
  const ungroupedSpecs: string[] = []
  
  if (hasGroups) {
    // Assign specs to groups
    allSpecKeys.forEach(key => {
      let assigned = false
      for (const [groupName, groupKeys] of Object.entries(categoryGroups)) {
        if (groupKeys.some(gk => key.toLowerCase().includes(gk.toLowerCase()) || gk.toLowerCase().includes(key.toLowerCase()))) {
          if (!organizedSpecs[groupName]) {
            organizedSpecs[groupName] = []
          }
          organizedSpecs[groupName].push(key)
          assigned = true
          break
        }
      }
      if (!assigned) {
        ungroupedSpecs.push(key)
      }
    })
  } else {
    // No grouping, use all specs as ungrouped
    ungroupedSpecs.push(...Array.from(allSpecKeys))
  }

  // Determine best values for highlighting
  const bestPrice = getBestPrice(products)
  const bestRating = getBestRating(products)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8 pb-24">
        <Container>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Product Comparison</h1>
              <p className="text-muted-foreground">
                Comparing {products.length} products side-by-side
              </p>
            </div>
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Product Cards */}
              <div 
                className="grid gap-4 mb-8" 
                style={{ gridTemplateColumns: `repeat(${products.length}, minmax(280px, 1fr))` }}
              >
                {products.map((product) => {
                  const productImages = parseAllImages(product.images)
                  const currentPrice = getEffectivePrice(product)
                  const originalPrice = product.salePrice ? product.price : null
                  const vendorName = product.vendor?.displayName ||
                    `${product.vendor?.firstName || ''} ${product.vendor?.lastName || ''}`.trim() || 'Unknown Vendor'
                  const isVendorVerified = product.vendor?.vendorStatus === 'approved'
                  const isBestPrice = currentPrice === bestPrice
                  const isBestRating = product.ratingAverage === bestRating && bestRating > 0

                  return (
                    <Card key={product.id} className={isBestPrice ? 'ring-2 ring-primary' : ''}>
                      <CardHeader className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 z-10"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {isBestPrice && (
                          <Badge className="absolute top-2 left-2 z-10 bg-primary">
                            Best Price
                          </Badge>
                        )}
                        <div className="aspect-square relative mb-4">
                          {productImages[0] ? (
                            <Image
                              src={productImages[0]}
                              alt={product.name}
                              fill
                              className="object-contain rounded-md"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                              No Image
                            </div>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {product.ratingAverage > 0 && (
                            <div className={`flex items-center gap-1 ${isBestRating ? 'text-yellow-500 font-bold' : ''}`}>
                              <Star className={`h-4 w-4 ${isBestRating ? 'fill-yellow-400 text-yellow-400' : 'fill-yellow-400 text-yellow-400'}`} />
                              <span className="text-sm font-medium">{Number(product.ratingAverage).toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">
                                ({product.ratingCount})
                              </span>
                              {isBestRating && <Badge variant="secondary" className="text-xs ml-1">Best Rated</Badge>}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Price */}
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${isBestPrice ? 'text-primary' : ''}`}>
                              {formatCurrency(currentPrice)}
                            </span>
                            {originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatCurrency(originalPrice)}
                              </span>
                            )}
                          </div>
                          {originalPrice && (
                            <Badge variant="destructive" className="mt-1">
                              {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                            </Badge>
                          )}
                        </div>

                        {/* Vendor */}
                        <div>
                          <p className="text-sm text-muted-foreground">Seller</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{vendorName}</p>
                            {isVendorVerified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </div>

                        {/* Stock */}
                        <div>
                          <p className="text-sm text-muted-foreground">Availability</p>
                          <p className={product.stockQuantity > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                            {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : 'Out of Stock'}
                          </p>
                        </div>

                        {/* Brand */}
                        {product.brand && (
                          <div>
                            <p className="text-sm text-muted-foreground">Brand</p>
                            <p className="font-medium">{product.brand}</p>
                          </div>
                        )}

                        {/* Category */}
                        {product.category?.name && (
                          <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <p className="font-medium">{product.category.name}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-4">
                          <Button
                            className="w-full"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stockQuantity === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/product/${product.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Specifications Comparison */}
              {allSpecKeys.size > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Specifications</CardTitle>
                      {sameCategory && categoryName && (
                        <Badge variant="secondary" className="text-sm">
                          {categoryName} - Category-Specific View
                        </Badge>
                      )}
                      {!sameCategory && (
                        <Badge variant="outline" className="text-sm text-yellow-600 dark:text-yellow-400">
                          Mixed Categories
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Render grouped specifications */}
                      {hasGroups && Object.entries(organizedSpecs).map(([groupName, specKeys]) => (
                        <div key={groupName} className="space-y-2">
                          <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">
                            {groupName}
                          </h3>
                          {specKeys.map((specKey) => {
                            const hasDiff = hasSpecDifference(products, specKey)
                            return (
                              <div 
                                key={specKey} 
                                className={`grid gap-4 ${hasDiff ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded-md' : ''}`}
                                style={{ gridTemplateColumns: `200px repeat(${products.length}, minmax(280px, 1fr))` }}
                              >
                                <div className={`font-medium py-2 px-4 bg-muted rounded flex items-center gap-2 ${hasDiff ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                  {specKey}
                                  {hasDiff && <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900">Different</Badge>}
                                </div>
                                {products.map((product) => {
                                  const specs = parseJsonField<Record<string, string>>(product.specifications, {})
                                  return (
                                    <div key={product.id} className={`py-2 px-4 border rounded ${hasDiff ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
                                      {specs[specKey] || '-'}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      
                      {/* Render ungrouped specifications */}
                      {ungroupedSpecs.length > 0 && (
                        <div className="space-y-2">
                          {hasGroups && (
                            <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">
                              Other Specifications
                            </h3>
                          )}
                          {ungroupedSpecs.map((specKey) => {
                            const hasDiff = hasSpecDifference(products, specKey)
                            return (
                              <div 
                                key={specKey} 
                                className={`grid gap-4 ${hasDiff ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded-md' : ''}`}
                                style={{ gridTemplateColumns: `200px repeat(${products.length}, minmax(280px, 1fr))` }}
                              >
                                <div className={`font-medium py-2 px-4 bg-muted rounded flex items-center gap-2 ${hasDiff ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                                  {specKey}
                                  {hasDiff && <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900">Different</Badge>}
                                </div>
                                {products.map((product) => {
                                  const specs = parseJsonField<Record<string, string>>(product.specifications, {})
                                  return (
                                    <div key={product.id} className={`py-2 px-4 border rounded ${hasDiff ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
                                      {specs[specKey] || '-'}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Features Comparison */}
              {products.some(p => {
                const features = parseJsonField<string[]>(p.features, [])
                return features.length > 0
              }) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="grid gap-4" 
                      style={{ gridTemplateColumns: `repeat(${products.length}, minmax(280px, 1fr))` }}
                    >
                      {products.map((product) => {
                        const features = parseJsonField<string[]>(product.features, [])
                        return (
                          <div key={product.id} className="space-y-2">
                            {features.length > 0 ? (
                              features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{feature}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No features listed</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
