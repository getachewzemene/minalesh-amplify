'use client'

import * as React from 'react'
import { Share2, Facebook, Twitter, Copy, Check, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import QRCode from 'qrcode'

interface ProductSocialShareProps {
  productId: string
  productName: string
  productDescription?: string
  productPrice: number
  productImage?: string
  url?: string
  variant?: 'default' | 'outline'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  showShareCount?: boolean
  className?: string
}

export function ProductSocialShare({
  productId,
  productName,
  productDescription,
  productPrice,
  productImage,
  url,
  variant = 'outline',
  size = 'lg',
  showShareCount = true,
  className
}: ProductSocialShareProps) {
  const [copied, setCopied] = React.useState(false)
  const [shareCount, setShareCount] = React.useState(0)
  const [showQRCode, setShowQRCode] = React.useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('')
  
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  
  // Sanitize text for sharing (remove potential XSS characters)
  const sanitizeText = (text: string) => {
    return text.replace(/[<>]/g, '').trim()
  }
  
  // Create pre-filled share text with product details (sanitized)
  const shareText = `Check out ${sanitizeText(productName)} for ${productPrice} ETB on Minalesh! ${productDescription ? sanitizeText(productDescription) : ''}`
  const shareTextShort = `${sanitizeText(productName)} - ${productPrice} ETB`

  // Fetch share count on mount
  React.useEffect(() => {
    if (showShareCount) {
      fetchShareCount()
    }
  }, [productId, showShareCount])

  const fetchShareCount = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShareCount(data.totalShares || 0)
      }
    } catch (error) {
      console.error('Error fetching share count:', error)
    }
  }

  const trackShare = async (platform: string) => {
    try {
      await fetch(`/api/products/${productId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      })
      // Update local count immediately
      setShareCount(prev => prev + 1)
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)
    const encodedTextShort = encodeURIComponent(shareTextShort)
    const encodedTitle = encodeURIComponent(productName)

    let shareLink = ''

    switch (platform) {
      case 'whatsapp':
        // WhatsApp with pre-filled message including product details
        shareLink = `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
        break
      case 'twitter':
        // Twitter with hashtags for Ethiopian market
        shareLink = `https://twitter.com/intent/tweet?text=${encodedTextShort}&url=${encodedUrl}&hashtags=Minalesh,Ethiopia,Shopping`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
        break
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success('Link copied to clipboard!')
          setTimeout(() => setCopied(false), 2000)
          await trackShare('copy_link')
          return
        } catch (err) {
          toast.error('Failed to copy link')
          return
        }
      case 'qr':
        await generateQRCode()
        setShowQRCode(true)
        await trackShare('qr_code')
        return
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
      await trackShare(platform)
    }
  }

  // Check if native share is available
  const canUseNativeShare = typeof navigator !== 'undefined' && navigator.share

  const handleNativeShare = async () => {
    if (!canUseNativeShare) return

    try {
      await navigator.share({
        title: productName,
        text: shareText,
        url: shareUrl,
      })
      toast.success('Shared successfully!')
      await trackShare('native')
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      setQrCodeDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    }
  }

  // Sanitize filename by removing invalid characters
  const sanitizeFilename = (name: string) => {
    return name.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-').toLowerCase()
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return
    
    const link = document.createElement('a')
    link.download = `${sanitizeFilename(productName)}-qrcode.png`
    link.href = qrCodeDataUrl
    link.click()
    toast.success('QR code downloaded!')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Share2 className="h-5 w-5" />
            {size !== 'icon' && showShareCount && shareCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({shareCount})
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canUseNativeShare && (
            <>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share...</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
            <svg
              className="mr-2 h-4 w-4 text-green-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>WhatsApp</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            <Facebook className="mr-2 h-4 w-4 text-blue-600" />
            <span>Facebook</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            <Twitter className="mr-2 h-4 w-4 text-sky-500" />
            <span>Twitter</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleShare('telegram')}>
            <svg
              className="mr-2 h-4 w-4 text-blue-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span>Telegram</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => handleShare('qr')}>
            <QrCode className="mr-2 h-4 w-4" />
            <span>QR Code</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleShare('copy')}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </DropdownMenuItem>

          {showShareCount && shareCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Shared {shareCount} time{shareCount !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code with your mobile device to view this product
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCodeDataUrl && (
              <>
                <div className="bg-white p-4 rounded-lg border-2 border-border">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <p className="font-medium">{productName}</p>
                  <p>{productPrice} ETB</p>
                </div>
                <Button onClick={downloadQRCode} variant="outline" className="w-full">
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
