'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, BellOff } from 'lucide-react'

interface FlashSaleRegistrationProps {
  flashSaleId: string
  flashSaleName: string
  startsAt: Date | string
  className?: string
}

export function FlashSaleRegistration({
  flashSaleId,
  flashSaleName,
  startsAt,
  className = '',
}: FlashSaleRegistrationProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  const hasStarted = useMemo(() => {
    const now = new Date()
    const startDate = new Date(startsAt)
    return now >= startDate
  }, [startsAt])

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user) {
        setIsCheckingStatus(false)
        return
      }

      try {
        const response = await fetch(`/api/flash-sales/${flashSaleId}/register`)
        if (response.ok) {
          const data = await response.json()
          setIsRegistered(data.registered)
        }
      } catch (error) {
        console.error('Error checking registration status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkRegistrationStatus()
  }, [flashSaleId, user])

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please log in to register for flash sales')
      router.push('/auth/login')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/flash-sales/${flashSaleId}/register`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setIsRegistered(true)
        toast.success('Successfully registered! You\'ll be notified when the sale starts.')
      } else {
        toast.error(data.error || 'Failed to register for flash sale')
      }
    } catch (error) {
      console.error('Error registering for flash sale:', error)
      toast.error('Failed to register for flash sale')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnregister = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/flash-sales/${flashSaleId}/register`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setIsRegistered(false)
        toast.success('Successfully unregistered from flash sale')
      } else {
        toast.error(data.error || 'Failed to unregister from flash sale')
      }
    } catch (error) {
      console.error('Error unregistering from flash sale:', error)
      toast.error('Failed to unregister from flash sale')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasStarted) {
    return null
  }

  if (isCheckingStatus) {
    return (
      <div className={`text-center ${className}`}>
        <Button disabled variant="outline">
          Checking status...
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {isRegistered ? (
        <div className="space-y-2">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">
                You're registered! We'll notify you when the sale starts.
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleUnregister}
            disabled={isLoading}
            className="w-full"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Unregister
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Register now to get notified when this flash sale starts!
            </p>
          </div>
          <Button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isLoading ? 'Registering...' : 'Notify Me'}
          </Button>
        </div>
      )}
    </div>
  )
}
