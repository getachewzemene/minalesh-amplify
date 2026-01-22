'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import ContractDetailsPage from '@/page-components/ContractDetailsPage'

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
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

  return <ContractDetailsPage contractId={params.id as string} />
}
