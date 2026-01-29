/**
 * API Client with CSRF Token Management
 * 
 * Centralized API client for making requests with automatic CSRF token handling.
 * Provides utilities for fetching and managing CSRF tokens for mutation requests.
 */

interface FetchOptions extends RequestInit {
  skipCSRF?: boolean;
}

interface CSRFTokenResponse {
  csrfToken: string;
}

// Cache CSRF token in memory
let csrfToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from server
 */
async function fetchCSRFToken(): Promise<string> {
  // Return existing promise if already fetching
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  // Fetch new token
  tokenFetchPromise = fetch('/api/auth/csrf-token', {
    method: 'GET',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data: CSRFTokenResponse = await response.json();
      csrfToken = data.csrfToken;
      tokenFetchPromise = null;
      return data.csrfToken;
    })
    .catch((error) => {
      tokenFetchPromise = null;
      throw error;
    });

  return tokenFetchPromise;
}

/**
 * Clear cached CSRF token (call on 403 CSRF errors to force refresh)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
  tokenFetchPromise = null;
}

/**
 * Get CSRF token (from cache or fetch new one)
 */
export async function getCSRFToken(): Promise<string> {
  return fetchCSRFToken();
}

/**
 * Make an API request with automatic CSRF token handling
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with response
 * 
 * @example
 * ```typescript
 * // POST request with CSRF
 * const data = await apiClient('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify({ items: [...] }),
 * });
 * 
 * // GET request (no CSRF needed)
 * const products = await apiClient('/api/products');
 * 
 * // Skip CSRF for specific requests
 * const data = await apiClient('/api/endpoint', {
 *   method: 'POST',
 *   skipCSRF: true,
 * });
 * ```
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipCSRF, ...fetchOptions } = options;
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF token for mutation methods
  const needsCSRF = !skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add Content-Type if not set and body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add CSRF token for mutations
  if (needsCSRF) {
    try {
      const token = await getCSRFToken();
      headers.set('X-CSRF-Token', token);
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Proceed without CSRF token - server will reject if required
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    method,
    headers,
    credentials: 'include', // Include cookies
  });

  // Handle CSRF validation failures
  if (response.status === 403) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      
      // If CSRF validation failed, clear token and retry once
      if (errorData.error === 'CSRF validation failed') {
        clearCSRFToken();
        
        // Retry the request with fresh token
        if (needsCSRF) {
          const retryToken = await getCSRFToken();
          headers.set('X-CSRF-Token', retryToken);
          
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            method,
            headers,
            credentials: 'include',
          });
          
          return handleResponse<T>(retryResponse);
        }
      }
    }
  }

  return handleResponse<T>(response);
}

/**
 * Handle API response and extract data
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  // Parse JSON response
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'Request failed',
        response.status,
        data
      );
    }
    
    return data as T;
  }
  
  // Handle non-JSON responses
  if (!response.ok) {
    const text = await response.text();
    throw new APIError(
      text || `Request failed with status ${response.status}`,
      response.status
    );
  }
  
  // Return text for non-JSON success responses
  return (await response.text()) as unknown as T;
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Type-safe API request helpers
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(url: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
