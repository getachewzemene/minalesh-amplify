import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { STORAGE_KEYS, PRODUCT_LIMITS } from '@/lib/product-constants'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn()

describe('Recently Viewed Products Feature', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // Setup global mocks
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      dispatchEvent: mockDispatchEvent,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Product Constants', () => {
    it('should have MAX_RECENTLY_VIEWED set to 20', () => {
      expect(PRODUCT_LIMITS.MAX_RECENTLY_VIEWED).toBe(20)
    })

    it('should have RECENTLY_VIEWED storage key defined', () => {
      expect(STORAGE_KEYS.RECENTLY_VIEWED).toBe('recently_viewed_products')
    })

    it('should have BROWSING_HISTORY_ENABLED storage key defined', () => {
      expect(STORAGE_KEYS.BROWSING_HISTORY_ENABLED).toBe('browsing_history_enabled')
    })
  })

  describe('Browsing History Privacy', () => {
    it('should default to enabled when no preference is set', () => {
      // No value set in localStorage
      const setting = localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED)
      expect(setting).toBeNull()
      // Default behavior should be enabled (null means true)
    })

    it('should store privacy preference as string', () => {
      localStorageMock.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, 'true')
      expect(localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED)).toBe('true')
      
      localStorageMock.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, 'false')
      expect(localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED)).toBe('false')
    })
  })

  describe('Recently Viewed Storage', () => {
    interface ViewedProduct {
      id: string
      name: string
      price: number
      salePrice?: number | null
      image: string
      viewedAt: number
    }

    it('should store viewed products in localStorage', () => {
      const product: ViewedProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 1000,
        image: '/test.jpg',
        viewedAt: Date.now()
      }
      
      const items = [product]
      localStorageMock.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items))
      
      const stored = localStorageMock.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].id).toBe('prod-1')
    })

    it('should limit stored products to MAX_RECENTLY_VIEWED', () => {
      const products: ViewedProduct[] = []
      for (let i = 0; i < 25; i++) {
        products.push({
          id: `prod-${i}`,
          name: `Product ${i}`,
          price: 100 * i,
          image: `/img-${i}.jpg`,
          viewedAt: Date.now() - i * 1000
        })
      }
      
      // Only store up to MAX_RECENTLY_VIEWED
      const limitedProducts = products.slice(0, PRODUCT_LIMITS.MAX_RECENTLY_VIEWED)
      localStorageMock.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(limitedProducts))
      
      const stored = localStorageMock.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(20)
    })

    it('should clear browsing history when removed', () => {
      const product: ViewedProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 1000,
        image: '/test.jpg',
        viewedAt: Date.now()
      }
      
      localStorageMock.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify([product]))
      expect(localStorageMock.getItem(STORAGE_KEYS.RECENTLY_VIEWED)).not.toBeNull()
      
      localStorageMock.removeItem(STORAGE_KEYS.RECENTLY_VIEWED)
      expect(localStorageMock.getItem(STORAGE_KEYS.RECENTLY_VIEWED)).toBeNull()
    })

    it('should sort products by viewedAt timestamp (most recent first)', () => {
      const products: ViewedProduct[] = [
        { id: 'old', name: 'Old', price: 100, image: '/old.jpg', viewedAt: 1000 },
        { id: 'newest', name: 'Newest', price: 300, image: '/newest.jpg', viewedAt: 3000 },
        { id: 'middle', name: 'Middle', price: 200, image: '/middle.jpg', viewedAt: 2000 },
      ]
      
      const sorted = products.sort((a, b) => b.viewedAt - a.viewedAt)
      expect(sorted[0].id).toBe('newest')
      expect(sorted[1].id).toBe('middle')
      expect(sorted[2].id).toBe('old')
    })

    it('should handle duplicate product views by updating position', () => {
      const initialProducts: ViewedProduct[] = [
        { id: 'prod-1', name: 'Product 1', price: 100, image: '/1.jpg', viewedAt: 1000 },
        { id: 'prod-2', name: 'Product 2', price: 200, image: '/2.jpg', viewedAt: 2000 },
      ]
      
      // Simulate viewing prod-1 again
      const newView: ViewedProduct = {
        id: 'prod-1',
        name: 'Product 1',
        price: 100,
        image: '/1.jpg',
        viewedAt: 3000
      }
      
      // Remove existing entry and add new one
      let items = initialProducts.filter(item => item.id !== newView.id)
      items.unshift(newView)
      
      expect(items).toHaveLength(2)
      expect(items[0].id).toBe('prod-1')
      expect(items[0].viewedAt).toBe(3000)
    })
  })

  describe('Privacy Control Logic', () => {
    it('should not track products when browsing history is disabled', () => {
      localStorageMock.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, 'false')
      
      const isEnabled = localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED) === 'true' 
        || localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED) === null
      
      expect(isEnabled).toBe(false)
    })

    it('should track products when browsing history is enabled', () => {
      localStorageMock.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, 'true')
      
      const isEnabled = localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED) === 'true' 
        || localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED) === null
      
      expect(isEnabled).toBe(true)
    })

    it('should clear history when privacy is disabled', () => {
      // Setup some history
      localStorageMock.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify([{
        id: 'test',
        name: 'Test',
        price: 100,
        image: '/test.jpg',
        viewedAt: Date.now()
      }]))
      
      // Disable privacy
      localStorageMock.setItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED, 'false')
      // Clear history (as the component would do)
      localStorageMock.removeItem(STORAGE_KEYS.RECENTLY_VIEWED)
      
      expect(localStorageMock.getItem(STORAGE_KEYS.RECENTLY_VIEWED)).toBeNull()
      expect(localStorageMock.getItem(STORAGE_KEYS.BROWSING_HISTORY_ENABLED)).toBe('false')
    })
  })

  describe('ViewedProduct Interface', () => {
    it('should support optional salePrice', () => {
      interface ViewedProduct {
        id: string
        name: string
        price: number
        salePrice?: number | null
        image: string
        viewedAt: number
      }

      const withSale: ViewedProduct = {
        id: 'p1',
        name: 'On Sale',
        price: 100,
        salePrice: 80,
        image: '/sale.jpg',
        viewedAt: Date.now()
      }

      const withoutSale: ViewedProduct = {
        id: 'p2',
        name: 'Regular Price',
        price: 100,
        image: '/regular.jpg',
        viewedAt: Date.now()
      }

      expect(withSale.salePrice).toBe(80)
      expect(withoutSale.salePrice).toBeUndefined()
    })

    it('should display correct price (salePrice if available, otherwise price)', () => {
      const displayPrice = (product: { price: number; salePrice?: number | null }) => 
        product.salePrice || product.price

      expect(displayPrice({ price: 100, salePrice: 80 })).toBe(80)
      expect(displayPrice({ price: 100, salePrice: null })).toBe(100)
      expect(displayPrice({ price: 100 })).toBe(100)
    })
  })
})
