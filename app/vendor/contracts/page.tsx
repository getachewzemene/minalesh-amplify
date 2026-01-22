'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import VendorContractsPage from '@/page-components/VendorContractsPage'

export default function ContractsPage() {
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

  return <VendorContractsPage />
}
