/**
 * Utility functions for parsing and handling product images
 */

/**
 * Normalize image URL to ensure it starts with / for local paths
 * Handles external URLs (http/https) correctly
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // Don't modify external URLs
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Add leading slash for local paths
  return url.startsWith('/') ? url : `/${url}`
}

/**
 * Parse the primary (first) image from various image storage formats
 */
export function parsePrimaryImage(images: any): string | null {
  if (Array.isArray(images)) {
    const first = images[0]
    const url = typeof first === 'string' ? first : first?.url || first?.src
    return normalizeImageUrl(url)
  }
  
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0]
        const url = typeof first === 'string' ? first : first?.url || first?.src
        return normalizeImageUrl(url)
      }
    } catch {
      return normalizeImageUrl(images)
    }
  }
  
  const obj = images as any
  const url = obj?.url || obj?.src
  return normalizeImageUrl(url)
}

/**
 * Parse all images from various storage formats into an array of URLs
 */
export function parseAllImages(images: any): string[] {
  if (Array.isArray(images)) {
    return images.map(img => {
      const url = typeof img === 'string' ? img : img?.url || img?.src
      return normalizeImageUrl(url) || '/placeholder-product.jpg'
    })
  }
  
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed.map(img => {
          const url = typeof img === 'string' ? img : img?.url || img?.src
          return normalizeImageUrl(url) || '/placeholder-product.jpg'
        })
      }
    } catch {
      return [normalizeImageUrl(images) || '/placeholder-product.jpg']
    }
  }
  
  return ['/placeholder-product.jpg']
}

/**
 * Get the effective price of a product (sale price if available, otherwise regular price)
 */
export function getEffectivePrice(product: { price: number; salePrice?: number | null }): number {
  return product.salePrice ? Number(product.salePrice) : Number(product.price)
}

/**
 * Parse a JSON field with a fallback value
 * Handles both JSON strings and already-parsed objects
 */
export function parseJsonField<T>(field: string | T | null | undefined, fallback: T): T {
  if (!field) return fallback
  
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return fallback
    }
  }
  
  // If it's already parsed (array or object), return as-is
  if (typeof field === 'object') {
    return field as T
  }
  
  return fallback
}
