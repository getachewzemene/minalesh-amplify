'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Gift, Loader2, CreditCard } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GiftCardFormProps {
  onSuccess?: (giftCard: {
    code: string
    amount: number
    balance: number
    expiresAt: string
  }) => void
  onCancel?: () => void
}

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2000]

export function GiftCardPurchaseForm({ onSuccess, onCancel }: GiftCardFormProps) {
  const [amount, setAmount] = useState<number>(100)
  const [customAmount, setCustomAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [purchasedCard, setPurchasedCard] = useState<{
    code: string
    amount: number
    balance: number
    expiresAt: string
  } | null>(null)
  const { toast } = useToast()

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 10000) {
      setAmount(numValue)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount < 50 || amount > 10000) {
      toast({
        title: 'Invalid Amount',
        description: 'Gift card amount must be between 50 and 10,000 ETB',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          recipientEmail: recipientEmail.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to purchase gift card')
      }

      const data = await response.json()
      setPurchasedCard({
        code: data.code,
        amount: data.amount,
        balance: data.balance,
        expiresAt: data.expiresAt,
      })

      toast({
        title: 'Success!',
        description: 'Gift card purchased successfully',
      })

      if (onSuccess) {
        onSuccess(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to purchase gift card',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (purchasedCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Gift Card Purchased!
          </CardTitle>
          <CardDescription>
            Your gift card is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {recipientEmail 
                ? `A confirmation email has been sent to ${recipientEmail} with the gift card code.`
                : 'Save this gift card code in a safe place.'}
            </AlertDescription>
          </Alert>

          <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Gift className="h-8 w-8" />
                <span className="text-lg font-semibold">Minalesh Gift Card</span>
              </div>
              <div className="text-center py-4">
                <p className="text-sm opacity-90 mb-2">Gift Card Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{purchasedCard.code}</p>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="opacity-75">Amount</p>
                  <p className="font-semibold">{purchasedCard.amount} ETB</p>
                </div>
                <div className="text-right">
                  <p className="opacity-75">Expires</p>
                  <p className="font-semibold">
                    {new Date(purchasedCard.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Your Message:</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(purchasedCard.code)
                toast({ title: 'Copied!', description: 'Gift card code copied to clipboard' })
              }}
            >
              Copy Code
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                setPurchasedCard(null)
                setAmount(100)
                setRecipientEmail('')
                setMessage('')
              }}
            >
              Purchase Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Purchase Gift Card
        </CardTitle>
        <CardDescription>
          Send a gift card to someone special or treat yourself
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-3">
            <Label>Select Amount (ETB)</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant={amount === presetAmount && !customAmount ? 'default' : 'outline'}
                  onClick={() => handleAmountSelect(presetAmount)}
                  className="w-full"
                >
                  {presetAmount} ETB
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom Amount (50-10,000 ETB)</Label>
            <div className="relative">
              <Input
                id="custom-amount"
                type="number"
                min="50"
                max="10000"
                step="10"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETB
              </span>
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Selected Amount:</span>
              <span className="text-2xl font-bold">{amount} ETB</span>
            </div>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email (Optional)</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty if you want to use the gift card yourself
            </p>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Write a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || amount < 50 || amount > 10000}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase for {amount} ETB
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
