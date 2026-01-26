'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Zap, Calendar, DollarSign } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Product {
  id: string
  name: string
  price: number
  stockQuantity: number
  isActive: boolean
  vendor: {
    profile: {
      firstName: string
      lastName: string
    }
  }
}

export default function AdminCreateFlashSalePage() {
  const router = useRouter()
  const { loading, user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productId: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: '',
    originalPrice: '',
    flashPrice: '',
    stockLimit: '',
    startsAt: '',
    endsAt: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else if (user.role !== 'admin') {
        router.replace('/')
      }
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      // Admins can see all products
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        toast.error('Failed to load products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        originalPrice: product.price.toString(),
        name: prev.name || `${product.name} Flash Sale`,
      }))
    }
  }

  const calculateFlashPrice = () => {
    const original = parseFloat(formData.originalPrice)
    const discount = parseFloat(formData.discountValue)
    
    if (isNaN(original) || isNaN(discount)) return

    let flashPrice = 0
    if (formData.discountType === 'percentage') {
      flashPrice = original - (original * discount / 100)
    } else {
      flashPrice = original - discount
    }

    setFormData(prev => ({
      ...prev,
      flashPrice: flashPrice > 0 ? flashPrice.toFixed(2) : '0',
    }))
  }

  useEffect(() => {
    if (formData.originalPrice && formData.discountValue) {
      calculateFlashPrice()
    }
  }, [formData.originalPrice, formData.discountValue, formData.discountType])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Flash sale name is required'
    }

    if (!formData.productId) {
      newErrors.productId = 'Please select a product'
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0'
    }

    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%'
    }

    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
      newErrors.originalPrice = 'Original price must be greater than 0'
    }

    if (!formData.flashPrice || parseFloat(formData.flashPrice) <= 0) {
      newErrors.flashPrice = 'Flash price must be greater than 0'
    }

    if (parseFloat(formData.flashPrice) >= parseFloat(formData.originalPrice)) {
      newErrors.flashPrice = 'Flash price must be less than original price'
    }

    if (!formData.startsAt) {
      newErrors.startsAt = 'Start date is required'
    }

    if (!formData.endsAt) {
      newErrors.endsAt = 'End date is required'
    }

    if (formData.startsAt && formData.endsAt) {
      const start = new Date(formData.startsAt)
      const end = new Date(formData.endsAt)
      const now = new Date()

      if (start >= end) {
        newErrors.endsAt = 'End date must be after start date'
      }

      if (end <= now) {
        newErrors.endsAt = 'End date must be in the future'
      }
    }

    if (formData.stockLimit && formData.productId) {
      const product = products.find(p => p.id === formData.productId)
      const stockLimit = parseInt(formData.stockLimit)
      
      if (stockLimit <= 0) {
        newErrors.stockLimit = 'Stock limit must be greater than 0'
      } else if (product && stockLimit > product.stockQuantity) {
        newErrors.stockLimit = `Stock limit cannot exceed available stock (${product.stockQuantity})`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/flash-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          productId: formData.productId,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          originalPrice: parseFloat(formData.originalPrice),
          flashPrice: parseFloat(formData.flashPrice),
          stockLimit: formData.stockLimit ? parseInt(formData.stockLimit) : undefined,
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: new Date(formData.endsAt).toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Flash sale created successfully!')
        router.push('/admin/flash-sales')
      } else {
        toast.error(data.error || 'Failed to create flash sale')
      }
    } catch (error) {
      console.error('Error creating flash sale:', error)
      toast.error('Failed to create flash sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user || user.role !== 'admin') {
    return null
  }

  const selectedProduct = products.find(p => p.id === formData.productId)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-red-600" />
          Create Flash Sale
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up a time-limited flash sale (Admin)
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the flash sale name and select the product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">
                  Product <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={formData.productId}
                  onValueChange={handleProductChange}
                  disabled={isLoadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p.isActive)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ETB {product.price} ({product.vendor?.profile?.firstName || 'Unknown Vendor'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className="text-sm text-red-600">{errors.productId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Flash Sale Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekend Flash Sale"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your flash sale offer..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set the discount and pricing for this flash sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'percentage' | 'fixed_amount') =>
                      setFormData(prev => ({ ...prev, discountType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount (ETB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount Value <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    placeholder={formData.discountType === 'percentage' ? 'e.g., 30' : 'e.g., 500'}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, discountValue: e.target.value }))
                    }
                  />
                  {errors.discountValue && (
                    <p className="text-sm text-red-600">{errors.discountValue}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">
                    Original Price (ETB) <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 1000"
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, originalPrice: e.target.value }))
                    }
                  />
                  {errors.originalPrice && (
                    <p className="text-sm text-red-600">{errors.originalPrice}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flashPrice">Flash Price (ETB)</Label>
                  <Input
                    id="flashPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated"
                    value={formData.flashPrice}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, flashPrice: e.target.value }))
                    }
                  />
                  {errors.flashPrice && (
                    <p className="text-sm text-red-600">{errors.flashPrice}</p>
                  )}
                </div>
              </div>

              {formData.originalPrice && formData.flashPrice && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Discount: <strong>{Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.flashPrice)) / parseFloat(formData.originalPrice)) * 100)}%</strong> off
                    {' | '}
                    Savings: <strong>ETB {(parseFloat(formData.originalPrice) - parseFloat(formData.flashPrice)).toFixed(2)}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Schedule & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Stock</CardTitle>
              <CardDescription>
                Set the dates and stock limit for this flash sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">
                    Start Date & Time <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, startsAt: e.target.value }))
                    }
                  />
                  {errors.startsAt && (
                    <p className="text-sm text-red-600">{errors.startsAt}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endsAt">
                    End Date & Time <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, endsAt: e.target.value }))
                    }
                  />
                  {errors.endsAt && (
                    <p className="text-sm text-red-600">{errors.endsAt}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockLimit">
                  Stock Limit (Optional)
                </Label>
                <Input
                  id="stockLimit"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={formData.stockLimit}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, stockLimit: e.target.value }))
                  }
                />
                {selectedProduct && (
                  <p className="text-sm text-muted-foreground">
                    Available stock: {selectedProduct.stockQuantity} units
                  </p>
                )}
                {errors.stockLimit && (
                  <p className="text-sm text-red-600">{errors.stockLimit}</p>
                )}
              </div>

              {formData.startsAt && formData.endsAt && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Duration: {Math.round((new Date(formData.endsAt).getTime() - new Date(formData.startsAt).getTime()) / (1000 * 60 * 60))} hours
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Flash Sale'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
