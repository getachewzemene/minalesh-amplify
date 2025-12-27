'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import VendorVerification from "@/page-components/VendorVerification"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Container } from "@/components/ui/container"

export default function VendorVerificationPage() {
  const router = useRouter()
  const { loading, profile, user } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else if (!profile?.isVendor) {
        router.replace('/')
      }
    }
  }, [loading, profile, user, router])

  if (loading || !user || !profile?.isVendor) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <Container>
          <VendorVerification />
        </Container>
      </main>
      <Footer />
    </div>
  )
}
