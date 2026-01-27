'use client'

import { useEffect, useState, useMemo } from 'react'
import { Progress } from '@/components/ui/progress'

interface FlashSaleStockCounterProps {
  flashSaleId: string
  stockLimit: number | null
  stockSold: number
  refreshInterval?: number
  className?: string
}

interface StockData {
  stockLimit: number | null
  stockSold: number
  stockRemaining: number | null
  stockPercentage: number
  isActive: boolean
}

export function FlashSaleStockCounter({
  flashSaleId,
  stockLimit: initialStockLimit,
  stockSold: initialStockSold,
  refreshInterval = 5000,
  className = '',
}: FlashSaleStockCounterProps) {
  const [stockData, setStockData] = useState<StockData>({
    stockLimit: initialStockLimit,
    stockSold: initialStockSold,
    stockRemaining: initialStockLimit ? initialStockLimit - initialStockSold : null,
    stockPercentage: initialStockLimit
      ? Math.round((initialStockSold / initialStockLimit) * 100)
      : 0,
    isActive: true,
  })

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(`/api/flash-sales/${flashSaleId}/stock`)
        if (response.ok) {
          const data = await response.json()
          setStockData({
            stockLimit: data.stockLimit,
            stockSold: data.stockSold,
            stockRemaining: data.stockRemaining,
            stockPercentage: data.stockPercentage,
            isActive: data.isActive,
          })
        }
      } catch (error) {
        console.error('Error fetching stock data:', error)
      }
    }

    const interval = setInterval(fetchStockData, refreshInterval)
    return () => clearInterval(interval)
  }, [flashSaleId, refreshInterval])

  const stockStatus = useMemo(() => {
    return stockData.stockPercentage >= 90 
      ? 'Almost Sold Out!'
      : stockData.stockPercentage >= 70
      ? 'Selling Fast!'
      : 'In Stock'
  }, [stockData.stockPercentage])

  if (!stockData.stockLimit) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <p>Unlimited Stock Available</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-muted-foreground">
          {stockStatus}
        </span>
        <span className="font-bold">
          {stockData.stockRemaining} / {stockData.stockLimit} left
        </span>
      </div>
      <Progress 
        value={stockData.stockPercentage} 
        className="h-2"
      />
      <p className="text-xs text-muted-foreground text-center">
        {stockData.stockSold} items sold
      </p>
    </div>
  )
}
