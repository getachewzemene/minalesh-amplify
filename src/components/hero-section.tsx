'use client'

import { ArrowRight, Smartphone, Headphones, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "./ui/container"
import heroImage from "@/assets/hero-marketplace.jpg"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function HeroSection() {
  const router = useRouter()
  const { user } = useAuth()
  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-[80vh] flex items-center">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:50px_50px] opacity-10" />
      
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Ethiopia's</span>
              <span className="block bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                Smart Marketplace
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto lg:mx-0">
              Minalesh (ምናለሽ) — Your trusted destination for electronics and general goods.
              Experience AR try-on technology, connect with verified vendors, and shop with confidence.
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => router.push('/auth/login')}
                >
                  Become a Vendor
                </Button>
              </div>
            )}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-white/80">Products</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-white/80">Vendors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-white/80">Customers</div>
              </div>
            </div>
          </div>

          {/* Visual elements */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
                  <Smartphone className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-white mb-2">Electronics</h3>
                  <p className="text-sm text-white/80">Latest smartphones, tablets & accessories</p>
                </div>
                <div className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
                  <Camera className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-white mb-2">AR Try-On</h3>
                  <p className="text-sm text-white/80">Virtual try-on for caps & sunglasses</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/20">
                  <Headphones className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-white mb-2">Audio</h3>
                  <p className="text-sm text-white/80">Premium headphones & speakers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}