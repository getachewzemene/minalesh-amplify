/**
 * useCSRF Hook
 * 
 * React hook for managing CSRF tokens in components.
 * Provides utilities for fetching and managing CSRF tokens.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCSRFToken, clearCSRFToken } from '@/lib/api-client';

interface UseCSRFReturn {
  token: string | null;
  loading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

/**
 * Hook to manage CSRF token
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { token, loading, error, refreshToken } = useCSRF();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   // Use token in forms or requests
 *   return <form>...</form>;
 * }
 * ```
 */
export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const csrfToken = await getCSRFToken();
      setToken(csrfToken);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch CSRF token'));
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    clearCSRFToken();
    await fetchToken();
  }, [fetchToken]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loading,
    error,
    refreshToken,
  };
}

export default useCSRF;
