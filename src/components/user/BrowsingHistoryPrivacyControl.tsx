'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  isBrowsingHistoryEnabled, 
  setBrowsingHistoryEnabled, 
  clearBrowsingHistory 
} from '@/components/product/RecentlyViewedProducts'
import { STORAGE_KEYS } from '@/lib/product-constants'

export function BrowsingHistoryPrivacyControl() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    // Load initial state
    setIsEnabled(isBrowsingHistoryEnabled())
    updateHistoryCount()

    // Listen for changes
    const handleUpdate = () => {
      updateHistoryCount()
    }

    window.addEventListener('recently-viewed-updated', handleUpdate)
    window.addEventListener('browsing-history-preference-changed', () => {
      setIsEnabled(isBrowsingHistoryEnabled())
      updateHistoryCount()
    })

    return () => {
      window.removeEventListener('recently-viewed-updated', handleUpdate)
      window.removeEventListener('browsing-history-preference-changed', () => {
        setIsEnabled(isBrowsingHistoryEnabled())
        updateHistoryCount()
      })
    }
  }, [])

  const updateHistoryCount = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
      if (stored) {
        const items = JSON.parse(stored)
        setHistoryCount(Array.isArray(items) ? items.length : 0)
      } else {
        setHistoryCount(0)
      }
    } catch {
      setHistoryCount(0)
    }
  }

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    setBrowsingHistoryEnabled(enabled)
    
    if (enabled) {
      toast.success('Browsing history tracking enabled')
    } else {
      toast.success('Browsing history tracking disabled and history cleared')
    }
  }

  const handleClearHistory = () => {
    clearBrowsingHistory()
    setHistoryCount(0)
    toast.success('Browsing history cleared')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Browsing History
        </CardTitle>
        <CardDescription>
          Control your product browsing history and privacy settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle for enabling/disabling browsing history */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="browsing-history-toggle" className="text-base font-medium">
              Track Browsing History
            </Label>
            <p className="text-sm text-muted-foreground">
              {isEnabled 
                ? 'Your recently viewed products are being tracked for a personalized experience'
                : 'Browsing history is disabled - your product views are not being saved'
              }
            </p>
          </div>
          <Switch
            id="browsing-history-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {/* Current history status */}
        <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Eye className="h-5 w-5 text-primary" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isEnabled ? 'History is active' : 'History is disabled'}
              </p>
              <p className="text-xs text-muted-foreground">
                {historyCount > 0 
                  ? `${historyCount} product${historyCount !== 1 ? 's' : ''} in your history`
                  : 'No products in your history'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Clear history button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={historyCount === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Browsing History
              {historyCount > 0 && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {historyCount}
                </span>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Browsing History?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your browsing history ({historyCount} product{historyCount !== 1 ? 's' : ''}). 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory}>
                Clear History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground">
          Your browsing history is stored locally on your device and is not shared with anyone. 
          Disabling this feature will also clear your existing history.
        </p>
      </CardContent>
    </Card>
  )
}
