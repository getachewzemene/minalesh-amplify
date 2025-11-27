'use client';

/**
 * useOfflineProducts Hook
 * 
 * Provides offline-capable product data fetching and caching.
 * Products that have been fetched while online are cached in IndexedDB
 * and can be viewed when the user is offline.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  cacheProducts, 
  getAllCachedProducts, 
  getCachedProduct,
  clearExpiredProducts,
  isOnline as checkIsOnline,
  type CachedProduct 
} from '@/lib/offline-cache';

interface UseOfflineProductsOptions {
  autoRefresh?: boolean;
}

interface UseOfflineProductsReturn {
  products: CachedProduct[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  isUsingCache: boolean;
  refreshProducts: () => Promise<void>;
}

/**
 * Hook for fetching products with offline capability
 */
export function useOfflineProducts(
  fetchUrl: string,
  options: UseOfflineProductsOptions = {}
): UseOfflineProductsReturn {
  const { autoRefresh = true } = options;
  
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (autoRefresh) {
        refreshProducts();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      loadFromCache();
    };

    // Set initial state
    setIsOffline(!checkIsOnline());
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Load products from cache
  const loadFromCache = useCallback(async () => {
    try {
      const cachedProducts = await getAllCachedProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setIsUsingCache(true);
        setError(null);
      } else {
        setError('No cached products available. Please connect to the internet.');
      }
    } catch (err) {
      console.error('Failed to load from cache:', err);
      setError('Failed to load cached products.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch products from server and cache them
  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If offline, load from cache
      if (!checkIsOnline()) {
        await loadFromCache();
        return;
      }

      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Transform and normalize product data
      const transformedProducts: CachedProduct[] = data.products.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        name: String(p.name),
        price: Number(p.price),
        originalPrice: p.salePrice ? Number(p.salePrice) : undefined,
        rating: Number((p.ratingAverage as number) || 0),
        reviews: Number((p.ratingCount as number) || 0),
        image: (p.images as string[])?.length > 0 ? (p.images as string[])[0] : '',
        category: (p.category as { name?: string })?.name || 'Uncategorized',
        vendor: (p.vendor as { displayName?: string })?.displayName || 'Unknown',
        isVerifiedVendor: (p.vendor as { vendorStatus?: string })?.vendorStatus === 'approved',
        hasAR: false,
        description: String(p.description || ''),
        stockQuantity: Number(p.stockQuantity || 0),
      }));
      
      setProducts(transformedProducts);
      setIsUsingCache(false);
      
      // Cache the products for offline use
      await cacheProducts(transformedProducts);
      
      // Clean up expired cache entries
      await clearExpiredProducts();
      
    } catch (err) {
      console.error('Failed to fetch products:', err);
      
      // If fetch fails, try to load from cache
      const cachedProducts = await getAllCachedProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setIsUsingCache(true);
        setError('Unable to fetch latest products. Showing cached version.');
      } else {
        setError('Failed to fetch products and no cached data available.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl, loadFromCache]);

  // Initial load
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return {
    products,
    isLoading,
    isOffline,
    error,
    isUsingCache,
    refreshProducts,
  };
}

interface UseOfflineProductOptions {
  fallbackData?: CachedProduct | null;
}

interface UseOfflineProductReturn {
  product: CachedProduct | null;
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  isUsingCache: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching a single product with offline capability
 */
export function useOfflineProduct(
  productId: string,
  options: UseOfflineProductOptions = {}
): UseOfflineProductReturn {
  const { fallbackData = null } = options;
  
  const [product, setProduct] = useState<CachedProduct | null>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!checkIsOnline());
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load product from cache
  const loadFromCache = useCallback(async (): Promise<CachedProduct | null> => {
    try {
      return await getCachedProduct(productId);
    } catch {
      return null;
    }
  }, [productId]);

  // Fetch product from server
  const refresh = useCallback(async () => {
    if (!productId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try cache first if offline
      if (!checkIsOnline()) {
        const cachedProduct = await loadFromCache();
        if (cachedProduct) {
          setProduct(cachedProduct);
          setIsUsingCache(true);
        } else {
          setError('Product not available offline.');
        }
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      
      // Transform product data (without cachedAt, which will be added when caching)
      const transformedProduct: Omit<CachedProduct, 'cachedAt'> = {
        id: String(data.id),
        name: String(data.name),
        price: Number(data.price),
        originalPrice: data.salePrice ? Number(data.salePrice) : undefined,
        rating: Number(data.ratingAverage || 0),
        reviews: Number(data.ratingCount || 0),
        image: data.images?.length > 0 ? data.images[0] : '',
        category: data.category?.name || 'Uncategorized',
        vendor: data.vendor?.displayName || 'Unknown',
        isVerifiedVendor: data.vendor?.vendorStatus === 'approved',
        hasAR: false,
        description: String(data.description || ''),
        stockQuantity: Number(data.stockQuantity || 0),
      };
      
      // Create the full cached product with timestamp for state
      const productWithCache: CachedProduct = {
        ...transformedProduct,
        cachedAt: Date.now(),
      };
      
      setProduct(productWithCache);
      setIsUsingCache(false);
      
      // Cache the product for offline use
      await cacheProducts([transformedProduct]);
      
    } catch (err) {
      console.error('Failed to fetch product:', err);
      
      // Try loading from cache
      const cachedProduct = await loadFromCache();
      if (cachedProduct) {
        setProduct(cachedProduct);
        setIsUsingCache(true);
        setError('Unable to fetch latest data. Showing cached version.');
      } else {
        setError('Product not found.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, loadFromCache]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    product,
    isLoading,
    isOffline,
    error,
    isUsingCache,
    refresh,
  };
}
