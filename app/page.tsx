'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
import { ProductSection } from "@/components/product-section"
import { Footer } from "@/components/footer"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Note: Role-based redirects removed - can be implemented using profile.isVendor
  // if needed in the future
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
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

        {/* Recommended Products Section - only show if user is logged in */}
        {user && (
          <ProductSection
            title="Recommended for You"
            description="Personalized product recommendations based on your interests"
            endpoint="/api/products/recommendations"
            limit={8}
            showViewAll={false}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
