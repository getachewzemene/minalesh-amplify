'use client'

import { ArrowRight, Smartphone, Headphones, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "./ui/container"
import { MobileHeroCarousel } from "./MobileHeroCarousel"
import heroImage from "@/assets/hero-marketplace.jpg"
import { useRouter } from "next/navigation"
import type { StaticImageData } from "next/image"
import { useAuth } from "@/context/auth-context"

export function HeroSection() {
  const router = useRouter()
  const { user } = useAuth()
  // Next.js static image imports return an object with a `src` field; ensure we pass the URL string to CSS
  const bgUrl = typeof heroImage === 'string' ? heroImage : (heroImage as StaticImageData).src
  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-[60vh] md:min-h-[80vh] flex items-center">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:50px_50px] opacity-10" />
      
      <Container className="relative z-10 px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              <span className="block">Ethiopia's</span>
              <span className="block bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                Smart Marketplace
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0">
              Minalesh (ምናለሽ) — Your trusted destination for electronics and general goods.
              Experience AR try-on technology, connect with verified vendors, and shop with confidence.
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold w-full sm:w-auto"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                  onClick={() => router.push('/auth/login')}
                >
                  Become a Vendor
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 md:mt-12 grid grid-cols-3 gap-3 md:gap-4 text-center lg:text-left">
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">10K+</div>
                <div className="text-xs md:text-sm text-white/80">Products</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">500+</div>
                <div className="text-xs md:text-sm text-white/80">Vendors</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-primary">50K+</div>
                <div className="text-xs md:text-sm text-white/80">Customers</div>
              </div>
            </div>
          </div>

          {/* Mobile Carousel - Flash Sales & Trending Products */}
          <div className="block md:hidden">
            <MobileHeroCarousel />
          </div>

          {/* Desktop Visual elements */}
          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur p-4 md:p-6 rounded-xl border border-white/20">
                  <Smartphone className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 md:mb-3" />
                  <h3 className="font-semibold text-white mb-1 md:mb-2 text-sm md:text-base">Electronics</h3>
                  <p className="text-xs md:text-sm text-white/80">Latest smartphones, tablets & accessories</p>
                </div>
                <div className="bg-white/10 backdrop-blur p-4 md:p-6 rounded-xl border border-white/20">
                  <Camera className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 md:mb-3" />
                  <h3 className="font-semibold text-white mb-1 md:mb-2 text-sm md:text-base">AR Try-On</h3>
                  <p className="text-xs md:text-sm text-white/80">Virtual try-on for caps & sunglasses</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur p-4 md:p-6 rounded-xl border border-white/20">
                  <Headphones className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 md:mb-3" />
                  <h3 className="font-semibold text-white mb-1 md:mb-2 text-sm md:text-base">Audio</h3>
                  <p className="text-xs md:text-sm text-white/80">Premium headphones & speakers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}