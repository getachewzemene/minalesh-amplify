'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse'
  message?: string
  className?: string
}

/**
 * LoadingState component - displays loading indicators
 */
export function LoadingState({ 
  variant = 'spinner', 
  message = 'Loading...', 
  className = '' 
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  // Default: skeleton variant
  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

/**
 * CardLoadingSkeleton - skeleton loader for card components
 */
export function CardLoadingSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-gradient-card shadow-card">
          <CardHeader>
            <Skeleton variant="shimmer" className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton variant="shimmer" className="h-4 w-full" />
            <Skeleton variant="shimmer" className="h-4 w-3/4" />
            <Skeleton variant="shimmer" className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

/**
 * TableLoadingSkeleton - skeleton loader for table components
 */
export function TableLoadingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton variant="shimmer" key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * ChartLoadingSkeleton - skeleton loader for chart components
 */
export function ChartLoadingSkeleton() {
  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <Skeleton variant="shimmer" className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton variant="shimmer" className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * ProductCardSkeleton - beautiful skeleton loader for product cards
 * @param count - Number of skeleton cards to display (default: 4)
 */
export function ProductCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-lg shadow-card border overflow-hidden"
        >
          {/* Image skeleton with shimmer */}
          <div className="relative overflow-hidden">
            <Skeleton variant="shimmer" className="w-full h-48 rounded-t-lg" />
            {/* Badge skeleton */}
            <div className="absolute top-3 left-3">
              <Skeleton variant="shimmer" className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Category badge */}
            <Skeleton variant="shimmer" className="h-5 w-20 rounded-md" />
            
            {/* Product name */}
            <Skeleton variant="shimmer" className="h-5 w-full" />
            <Skeleton variant="shimmer" className="h-5 w-4/5" />
            
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Skeleton variant="shimmer" className="h-3 w-24" />
              <Skeleton variant="shimmer" className="h-3 w-10" />
            </div>
            
            {/* Price */}
            <div className="flex items-center gap-2">
              <Skeleton variant="shimmer" className="h-6 w-24" />
              <Skeleton variant="shimmer" className="h-4 w-20" />
            </div>
            
            {/* Vendor */}
            <Skeleton variant="shimmer" className="h-3 w-32" />
            
            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Skeleton variant="shimmer" className="h-9 flex-1 rounded-md" />
              <Skeleton variant="shimmer" className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
