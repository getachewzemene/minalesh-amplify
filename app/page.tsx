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
