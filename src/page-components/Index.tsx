'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProductGrid } from "@/components/product-grid"
import { Footer } from "@/components/footer"
import { useAuth } from "@/context/auth-context"

const Index = () => {
  const { user } = useAuth()
  const router = useRouter()
  
  // Note: Role-based redirects removed - can be implemented using profile.isVendor
  // if needed in the future
  useEffect(() => {
    // Optional: Add role-based redirects here if needed
    if (false) { // Disabled for now
      router.push('/admin')
    } else if (false) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
