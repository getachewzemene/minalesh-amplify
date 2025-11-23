'use client'

import { useState } from 'react'
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { ProductCardSkeleton } from "@/components/ui/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function TestShimmerPage() {
  const [showLoading, setShowLoading] = useState(true)

  return (
    <div className="min-h-screen bg-background py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Shimmer Effect Demo</h1>
          <p className="text-muted-foreground mb-4">
            This page demonstrates the beautiful shimmer loading effect used throughout the app.
          </p>
          <Button onClick={() => setShowLoading(!showLoading)}>
            {showLoading ? 'Hide Loading' : 'Show Loading'}
          </Button>
        </div>

        {showLoading && (
          <div className="space-y-12">
            {/* Product Card Skeleton */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Product Cards with Shimmer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ProductCardSkeleton count={4} />
              </div>
            </div>

            {/* Various Skeleton Sizes */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Various Skeleton Elements</h2>
              <div className="space-y-4 max-w-2xl">
                <Skeleton variant="shimmer" className="h-12 w-full" />
                <Skeleton variant="shimmer" className="h-8 w-3/4" />
                <Skeleton variant="shimmer" className="h-6 w-1/2" />
                <Skeleton variant="shimmer" className="h-4 w-2/3" />
                
                <div className="flex gap-4">
                  <Skeleton variant="shimmer" className="h-24 w-24 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="shimmer" className="h-6 w-full" />
                    <Skeleton variant="shimmer" className="h-4 w-4/5" />
                    <Skeleton variant="shimmer" className="h-4 w-3/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Shimmer vs Pulse Comparison</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shimmer Effect (New)</h3>
                  <div className="space-y-3">
                    <Skeleton variant="shimmer" className="h-12 w-full" />
                    <Skeleton variant="shimmer" className="h-8 w-3/4" />
                    <Skeleton variant="shimmer" className="h-6 w-1/2" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pulse Effect (Old)</h3>
                  <div className="space-y-3">
                    <Skeleton variant="pulse" className="h-12 w-full" />
                    <Skeleton variant="pulse" className="h-8 w-3/4" />
                    <Skeleton variant="pulse" className="h-6 w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showLoading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Click the button above to see the shimmer effect</p>
          </div>
        )}
      </Container>
    </div>
  )
}
