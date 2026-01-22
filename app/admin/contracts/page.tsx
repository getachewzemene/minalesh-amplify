'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import AdminContractsManagement from '@/page-components/AdminContractsManagement'

export default function AdminContractsPage() {
  const router = useRouter()
  const { loading, user } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else if (user.role !== 'admin') {
        router.replace('/')
      }
    }
  }, [loading, user, router])

  if (loading || !user || user.role !== 'admin') {
    return null
  }

  return <AdminContractsManagement />
}
