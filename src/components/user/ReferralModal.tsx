'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Copy, Share2, RefreshCw, Mail, MessageCircle, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ReferralData {
  code: string
  expiresAt: string
  totalReferrals: number
  completedReferrals: number
}

interface ReferralModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReferralModal({ open, onOpenChange }: ReferralModalProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchReferralCode()
    }
  }, [open])

  const fetchReferralCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/referral/code')
      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
      } else {
        throw new Error('Failed to fetch referral code')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load referral code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateNewCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/referral/code', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setReferralData({
          ...referralData!,
          code: data.code,
          expiresAt: data.expiresAt,
        })
        toast({
          title: 'Success',
          description: 'New referral code generated',
        })
      } else {
        throw new Error('Failed to generate new code')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate new code',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const shareViaEmail = () => {
    const subject = 'Join Minalesh and Get Rewards!'
    const body = `Hey! I'm inviting you to join Minalesh marketplace. Use my referral code: ${referralData?.code}\n\nSign up at ${window.location.origin}?ref=${referralData?.code}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Minalesh!',
          text: `Use my referral code: ${referralData?.code}`,
          url: `${window.location.origin}?ref=${referralData?.code}`,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      toast({
        title: 'Not Supported',
        description: 'Sharing is not supported on this device',
        variant: 'destructive',
      })
    }
  }

  const referralUrl = referralData ? `${window.location.origin}?ref=${referralData.code}` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Referral Code
          </DialogTitle>
          <DialogDescription>
            Invite friends to Minalesh and earn rewards when they make their first purchase!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Your Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={referralData?.code || ''}
                readOnly
                className="font-mono text-lg font-bold text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => referralData && copyToClipboard(referralData.code)}
                disabled={loading || !referralData}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Referral URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Referral Link</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={referralUrl}
                readOnly
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralUrl)}
                disabled={loading || !referralData}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {referralData && (
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold">{referralData.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-green-600">{referralData.completedReferrals}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={shareViaEmail}
                disabled={loading || !referralData}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              {navigator.share && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={shareViaNative}
                  disabled={loading || !referralData}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>

          {/* Generate New Code */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateNewCode}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate New Code
          </Button>

          {/* Expiry Info */}
          {referralData && (
            <p className="text-xs text-center text-muted-foreground">
              Code expires: {new Date(referralData.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
