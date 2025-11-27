'use client';

/**
 * Offline Indicator Component
 * 
 * Displays a banner when the user is offline or viewing cached data.
 * Also provides a refresh button when viewing cached content.
 */

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isOnline as checkIsOnline } from '@/lib/offline-cache';

interface OfflineIndicatorProps {
  isUsingCache?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function OfflineIndicator({ 
  isUsingCache = false, 
  onRefresh,
  className = ''
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!checkIsOnline());
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Don't show anything if online and not using cache
  if (!isOffline && !isUsingCache) {
    return null;
  }

  return (
    <div 
      className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
        isOffline 
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' 
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <span>You&apos;re offline. Showing cached products.</span>
          </>
        ) : (
          <>
            <Database className="h-4 w-4" aria-hidden="true" />
            <span>Showing cached data. Refresh for latest products.</span>
          </>
        )}
      </div>
      
      {onRefresh && !isOffline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-4"
        >
          <RefreshCw 
            className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
            aria-hidden="true" 
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      )}
    </div>
  );
}

/**
 * Compact offline badge for use in headers or smaller spaces
 */
export function OfflineBadge() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!checkIsOnline());
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs"
      role="status"
      aria-label="Offline mode"
    >
      <WifiOff className="h-3 w-3" aria-hidden="true" />
      <span>Offline</span>
    </div>
  );
}
