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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Helper function to sync to server
  const syncToServer = useCallback(async (productIds: string[]) => {
    if (!isAuthenticated || productIds.length === 0) return

    try {
      await fetch('/api/products/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      })
    } catch (error) {
      console.error('Error syncing to server:', error)
    }
  }, [isAuthenticated])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        setIsAuthenticated(response.ok)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  // Load from localStorage on mount, then sync with server if authenticated
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

  // Sync with server when authenticated
  useEffect(() => {
    const syncWithServer = async () => {
      if (!mounted || !isAuthenticated || isSyncing) return

      setIsSyncing(true)
      try {
        // First, try to load from server
        const response = await fetch('/api/products/compare')
        if (response.ok) {
          const data = await response.json()
          if (data.comparisons && data.comparisons.length > 0) {
            // Get the most recent comparison
            const latestComparison = data.comparisons[0]
            if (latestComparison.productIds && latestComparison.productIds.length > 0) {
              // Fetch product details
              const productDetailsPromises = latestComparison.productIds.map((id: string) =>
                fetch(`/api/products/${id}`).then(r => r.json()).then(d => d.product)
              )
              const products = await Promise.all(productDetailsPromises)
              
              // Transform to ComparisonProduct format
              const comparisonProducts: ComparisonProduct[] = products
                .filter(Boolean)
                .map(p => ({
                  id: p.id,
                  name: p.name,
                  price: parseFloat(String(p.price)),
                  salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : null,
                  image: Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images)[0] : '/placeholder-product.jpg'),
                  category: p.category?.name,
                  brand: p.brand,
                  ratingAverage: parseFloat(String(p.ratingAverage || 0)),
                  stockQuantity: p.stockQuantity,
                }))
              
              if (comparisonProducts.length > 0) {
                setCompareProducts(comparisonProducts)
                setCompareBarVisible(true)
                // Update localStorage
                localStorage.setItem(STORAGE_KEYS.COMPARE_PRODUCTS, JSON.stringify(comparisonProducts))
              }
            }
          } else if (compareProducts.length > 0) {
            // If server has no comparison but we have local data, sync to server
            await syncToServer(compareProducts.map(p => p.id))
          }
        }
      } catch (error) {
        console.error('Error syncing comparison with server:', error)
      } finally {
        setIsSyncing(false)
      }
    }

    syncWithServer()
  }, [mounted, isAuthenticated, syncToServer])

  // Persist to localStorage and sync to server when compareProducts changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      if (compareProducts.length > 0) {
        localStorage.setItem(STORAGE_KEYS.COMPARE_PRODUCTS, JSON.stringify(compareProducts))
        // Sync to server if authenticated
        if (isAuthenticated && !isSyncing) {
          syncToServer(compareProducts.map(p => p.id))
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.COMPARE_PRODUCTS)
      }
    }
  }, [compareProducts, mounted, isAuthenticated])

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
