'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
import { ProductSection } from "@/components/product-section"
import { Footer } from "@/components/footer"
import { useAuth } from "@/context/auth-context"
import { RecentlyViewedProducts } from "@/components/product/RecentlyViewedProducts"
import { Container } from "@/components/ui/container"
import { PersonalizedRecommendations, TrendingProducts } from "@/components/recommendations"
import { FlashSalesList } from "@/components/flash-sales"
import { Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Note: Role-based redirects removed - can be implemented using profile.isVendor
  // if needed in the future
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mobile-container">
        <HeroSection />
        <ProductGrid />
        
        {/* Flash Sales Section */}
        <Container className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl md:text-3xl font-bold">🔥 Flash Sales</h2>
              </div>
              <p className="text-muted-foreground">Limited-time deals - Don't miss out!</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/flash-sales">
                View All
              </Link>
            </Button>
          </div>
          <FlashSalesList limit={4} />
        </Container>

        {/* New Arrivals Section */}
        <ProductSection
          title="New Arrivals"
          description="Discover the latest products added to our marketplace"
          endpoint="/api/products/new"
          limit={8}
          showViewAll={true}
          viewAllLink="/products?sort=newest"
        />

        {/* Top Products Section */}
        <ProductSection
          title="Top Products"
          description="Best-selling and most popular items from verified vendors"
          endpoint="/api/products/top"
          limit={8}
          showViewAll={true}
          viewAllLink="/products?sort=popular"
        />

        {/* Trending Products Section */}
        <TrendingProducts limit={8} days={7} />

        {/* Personalized Recommendations Section - only show if user is logged in */}
        <PersonalizedRecommendations />

        {/* Recently Viewed Products */}
        <Container className="py-8">
          <RecentlyViewedProducts />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
