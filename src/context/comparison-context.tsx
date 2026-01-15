'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { STORAGE_KEYS, PRODUCT_LIMITS } from '@/lib/product-constants'

export interface ComparisonProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  image: string
  category?: string
  brand?: string
  ratingAverage?: number
  stockQuantity?: number
  specifications?: Record<string, string>
  features?: string[]
  vendor?: string
}

interface ComparisonContextValue {
  compareProducts: ComparisonProduct[]
  addToCompare: (product: ComparisonProduct) => boolean
  removeFromCompare: (productId: string) => void
  clearCompare: () => void
  isInCompare: (productId: string) => boolean
  canAddMore: boolean
  isCompareBarVisible: boolean
  setCompareBarVisible: (visible: boolean) => void
}

const ComparisonContext = createContext<ComparisonContextValue | undefined>(undefined)

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [compareProducts, setCompareProducts] = useState<ComparisonProduct[]>([])
  const [isCompareBarVisible, setCompareBarVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPARE_PRODUCTS)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompareProducts(parsed)
            setCompareBarVisible(true)
          }
        } catch (e) {
          console.error('Error loading comparison list:', e)
        }
      }
    }
  }, [])

  // Persist to localStorage when compareProducts changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      if (compareProducts.length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPARE_PRODUCTS, JSON.stringify(compareProducts))
      } else {
        localStorage.removeItem(STORAGE_KEYS.COMPARE_PRODUCTS)
      }
    }
  }, [compareProducts, mounted])

  const canAddMore = compareProducts.length < PRODUCT_LIMITS.MAX_COMPARISON

  const isInCompare = useCallback((productId: string) => {
    return compareProducts.some(p => p.id === productId)
  }, [compareProducts])

  const addToCompare = useCallback((product: ComparisonProduct) => {
    // Check if already in comparison
    if (isInCompare(product.id)) {
      toast.info('Product already in comparison')
      return false
    }

    // Check max limit
    if (!canAddMore) {
      toast.error(`You can only compare up to ${PRODUCT_LIMITS.MAX_COMPARISON} products at a time`)
      return false
    }

    setCompareProducts(prev => [...prev, product])
    setCompareBarVisible(true)
    toast.success('Product added to comparison')
    return true
  }, [isInCompare, canAddMore])

  const removeFromCompare = useCallback((productId: string) => {
    setCompareProducts(prev => {
      const updated = prev.filter(p => p.id !== productId)
      if (updated.length === 0) {
        setCompareBarVisible(false)
      }
      return updated
    })
    toast.success('Product removed from comparison')
  }, [])

  const clearCompare = useCallback(() => {
    setCompareProducts([])
    setCompareBarVisible(false)
    toast.success('Comparison cleared')
  }, [])

  const value = useMemo(() => ({
    compareProducts,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore,
    isCompareBarVisible,
    setCompareBarVisible
  }), [compareProducts, addToCompare, removeFromCompare, clearCompare, isInCompare, canAddMore, isCompareBarVisible])

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const ctx = useContext(ComparisonContext)
  if (!ctx) {
    throw new Error('useComparison must be used within ComparisonProvider')
  }
  return ctx
}
