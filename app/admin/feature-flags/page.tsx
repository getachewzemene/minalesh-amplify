'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import AdminFeatureFlagsManagement from '@/page-components/AdminFeatureFlagsManagement'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Container } from '@/components/ui/container'

export default function AdminFeatureFlagsPage() {
  const router = useRouter()
  const { loading, user, profile } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user || !profile?.isAdmin) {
        router.replace('/admin/login')
      }
    }
  }, [loading, user, profile, router])

  if (loading || !user || !profile?.isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <AdminFeatureFlagsManagement />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
