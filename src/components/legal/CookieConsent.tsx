'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface CookiePreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const COOKIE_CONSENT_KEY = 'minalesh-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'minalesh-cookie-preferences'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000)
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        setPreferences(JSON.parse(savedPreferences))
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
      }
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    setShowBanner(false)
    setShowSettings(false)
    
    // Apply preferences (in real implementation, this would enable/disable tracking scripts)
    applyPreferences(prefs)
  }

  const applyPreferences = (prefs: CookiePreferences) => {
    // In a real implementation:
    // - Enable/disable Google Analytics based on analytics preference
    // - Enable/disable marketing pixels (Facebook, Google Ads) based on marketing preference
    // - Enable/disable preference cookies based on preferences setting
    
    console.log('Cookie preferences applied:', prefs)
    
    // Example: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        personalization_storage: prefs.preferences ? 'granted' : 'denied',
      })
    }
  }

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    }
    savePreferences(allAccepted)
  }

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    }
    savePreferences(essentialOnly)
  }

  const handleCustomize = () => {
    setShowSettings(true)
  }

  const saveCustomPreferences = () => {
    savePreferences(preferences)
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <Card className="mx-auto max-w-4xl shadow-lg border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">We value your privacy</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience, serve personalized content, 
                  and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                  You can customize your preferences or accept only essential cookies.
                </p>
                <div className="mt-2">
                  <a 
                    href="/legal/privacy" 
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                  >
                    Learn more about our privacy practices
                  </a>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCustomize}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={acceptEssential}
                >
                  Essential Only
                </Button>
                <Button 
                  size="sm" 
                  onClick={acceptAll}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Essential cookies are always enabled as they are 
              necessary for the website to function properly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label className="font-semibold">Essential Cookies</Label>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  These cookies are necessary for the website to function and cannot be disabled. 
                  They include authentication, security, and basic functionality.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1">
                <Label className="font-semibold">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This helps us improve our service.
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1">
                <Label className="font-semibold">Marketing Cookies</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Used to track visitors across websites to display relevant advertisements. 
                  These cookies help us show you products and offers that might interest you.
                </p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, marketing: checked }))
                }
              />
            </div>

            {/* Preference Cookies */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1">
                <Label className="font-semibold">Preference Cookies</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable the website to remember your choices (such as language, region, or theme) 
                  and provide enhanced, personalized features.
                </p>
              </div>
              <Switch 
                checked={preferences.preferences}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, preferences: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveCustomPreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
