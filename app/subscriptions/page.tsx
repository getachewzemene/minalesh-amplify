'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { PremiumSubscriptionCard, ProductSubscriptionsList } from '@/components/subscriptions'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Container } from '@/components/ui/container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, RefreshCw } from 'lucide-react'

export default function SubscriptionsPage() {
  const router = useRouter()
  const { loading, user } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login?redirect=/subscriptions')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">My Subscriptions</h1>
              <p className="text-muted-foreground mt-1">
                Manage your premium membership and product subscriptions
              </p>
            </div>

            <Tabs defaultValue="premium" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="premium" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Premium
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Subscribe &amp; Save
                </TabsTrigger>
              </TabsList>

              <TabsContent value="premium">
                <PremiumSubscriptionCard />
              </TabsContent>

              <TabsContent value="products">
                <ProductSubscriptionsList />
              </TabsContent>
            </Tabs>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
