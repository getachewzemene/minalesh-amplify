'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { FlashSalesList } from '@/components/flash-sales'
import { Container } from '@/components/ui/container'
import { Zap } from 'lucide-react'

export default function FlashSalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mobile-container py-8">
        <Container>
          {/* Page Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-red-600" />
              <h1 className="text-4xl font-bold">Flash Sales</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Don't miss out on our limited-time flash sales! Grab amazing deals before they're gone.
            </p>
          </div>

          {/* Flash Sales Grid */}
          <FlashSalesList />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
