'use client'

import { useEffect, useState } from 'react'
import { FlashSaleCard } from './FlashSaleCard'
import { Loader2 } from 'lucide-react'

interface FlashSale {
  id: string
  name: string
  description?: string
  productId: string
  discountType: string
  discountValue: number
  originalPrice: number
  flashPrice: number
  stockLimit: number | null
  stockSold: number
  startsAt: string | Date
  endsAt: string | Date
  isActive: boolean
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    description?: string
  }
  registrationCount?: number
  stockRemaining?: number | null
}

interface FlashSalesListProps {
  limit?: number
  className?: string
}

export function FlashSalesList({ limit, className = '' }: FlashSalesListProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/flash-sales')
        
        if (!response.ok) {
          throw new Error('Failed to fetch flash sales')
        }

        const data = await response.json()
        let sales = data.flashSales || []

        if (limit) {
          sales = sales.slice(0, limit)
        }

        setFlashSales(sales)
        setError(null)
      } catch (err) {
        console.error('Error fetching flash sales:', err)
        setError('Failed to load flash sales')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlashSales()
  }, [limit])

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (flashSales.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No active flash sales at the moment</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {flashSales.map((flashSale) => (
        <FlashSaleCard key={flashSale.id} flashSale={flashSale} />
      ))}
    </div>
  )
}
