/**
 * Constants for product-related features
 */

// Storage keys for localStorage
export const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'recently_viewed_products',
  COMPARE_PRODUCTS: 'compare_products',
  CART: 'shopping_cart',
  WISHLIST: 'wishlist',
  BROWSING_HISTORY_ENABLED: 'browsing_history_enabled'
} as const

// Product limits
export const PRODUCT_LIMITS = {
  MAX_COMPARISON: 4,
  MAX_RECENTLY_VIEWED: 20,
  MAX_FREQUENTLY_BOUGHT: 4
} as const

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  NEW_PRODUCT_THRESHOLD: 30 * 24 * 60 * 60 * 1000, // 30 days
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  STOCK_ALERT_EXPIRY: 90 * 24 * 60 * 60 * 1000 // 90 days
} as const

// Default values
export const DEFAULTS = {
  PLACEHOLDER_IMAGE: '/placeholder-product.jpg',
  PRODUCT_IMAGE_SIZES: '(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw'
} as const

// Badge thresholds
export const BADGE_THRESHOLDS = {
  BEST_SELLER_SALES: 50,
  TRENDING_VIEWS: 100,
  LOW_STOCK: 10,
  LIMITED_STOCK: 5,
  HIGHLY_RATED: 4.5
} as const
