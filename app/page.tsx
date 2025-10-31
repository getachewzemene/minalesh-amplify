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
  
  useEffect(() => {
    // Redirect admin/vendor to their dashboards
    if (user?.role === 'admin') {
      router.push('/admin')
    } else if (user?.role === 'vendor') {
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
  )
}
