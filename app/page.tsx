'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
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
      </main>
      <Footer />
    </div>
  )
}
