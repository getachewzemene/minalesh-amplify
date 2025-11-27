/**
 * Offline Cache Module
 * 
 * Provides IndexedDB-based caching for products to enable offline viewing.
 * Products that have been fetched online are cached and can be viewed offline.
 */

// Product interface for caching
export interface CachedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  vendor: string;
  isVerifiedVendor?: boolean;
  hasAR?: boolean;
  description?: string;
  stockQuantity?: number;
  cachedAt: number; // timestamp when cached
}

// Cache configuration
const DB_NAME = 'minalesh-offline-cache';
const DB_VERSION = 1;
const PRODUCTS_STORE = 'products';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Singleton promise for database connection
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens or creates the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create products store if it doesn't exist
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        const store = db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
        // Add indices for efficient querying
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Caches a single product
 */
export async function cacheProduct(product: Omit<CachedProduct, 'cachedAt'>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    const cachedProduct: CachedProduct = {
      ...product,
      cachedAt: Date.now(),
    };
    
    store.put(cachedProduct);
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache product:', error);
  }
}

/**
 * Caches multiple products at once
 */
export async function cacheProducts(products: Omit<CachedProduct, 'cachedAt'>[]): Promise<void> {
  if (typeof window === 'undefined' || products.length === 0) return;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    const now = Date.now();
    
    for (const product of products) {
      const cachedProduct: CachedProduct = {
        ...product,
        cachedAt: now,
      };
      store.put(cachedProduct);
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache products:', error);
  }
}

/**
 * Retrieves a cached product by ID
 */
export async function getCachedProduct(id: string): Promise<CachedProduct | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const product = request.result as CachedProduct | undefined;
        if (product && !isExpired(product.cachedAt)) {
          resolve(product);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached product:', error);
    return null;
  }
}

/**
 * Retrieves all cached products
 */
export async function getAllCachedProducts(): Promise<CachedProduct[]> {
  if (typeof window === 'undefined') return [];
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const products = (request.result as CachedProduct[])
          .filter(product => !isExpired(product.cachedAt));
        resolve(products);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached products:', error);
    return [];
  }
}

/**
 * Clears expired products from cache
 */
export async function clearExpiredProducts(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    const index = store.index('cachedAt');
    const expiredThreshold = Date.now() - CACHE_TTL;
    
    const range = IDBKeyRange.upperBound(expiredThreshold);
    
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear expired products:', error);
  }
}

/**
 * Clears all cached products
 */
export async function clearAllCachedProducts(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readwrite');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear cached products:', error);
  }
}

/**
 * Check if cached data has expired
 */
function isExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > CACHE_TTL;
}

/**
 * Get the number of cached products
 */
export async function getCachedProductCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(PRODUCTS_STORE, 'readonly');
    const store = transaction.objectStore(PRODUCTS_STORE);
    
    return await new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached product count:', error);
    return 0;
  }
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
