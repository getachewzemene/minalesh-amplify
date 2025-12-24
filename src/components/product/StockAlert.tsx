'use client'

import { useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

interface StockAlertProps {
  productId: string
  productName: string
  isInStock: boolean
}

export function StockAlert({ productId, productName, isInStock }: StockAlertProps) {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  if (isInStock) {
    return null
  }

  const handleSubscribe = async () => {
    const emailToUse = user?.email || email

    if (!emailToUse) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}/stock-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      })

      if (response.ok) {
        setSubscribed(true)
        toast.success("You'll be notified when this item is back in stock!")
      } else {
        toast.error("Failed to subscribe. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BellOff className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 dark:text-green-100">
                Alert Set!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                We'll email you when this product is back in stock
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Out of Stock - Get Notified
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Enter your email to be notified when this item is available again
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!user && (
              <Input
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
            )}
            <Button 
              onClick={handleSubscribe}
              disabled={loading || (!user && !email)}
              className="gap-2"
              variant={user ? "default" : "secondary"}
            >
              <Bell className="w-4 h-4" />
              {user ? 'Notify Me' : 'Subscribe'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
