'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GiftCardPurchaseForm } from '@/components/user/GiftCardPurchaseForm'
import { ReferralModal } from '@/components/user/ReferralModal'
import { Gift, Share2, BarChart3, ShoppingBag, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function FeaturesDemoPage() {
  const [referralModalOpen, setReferralModalOpen] = useState(false)

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">New Features Demo</h1>
        <p className="text-muted-foreground">
          Explore the newly implemented features for Minalesh marketplace
        </p>
      </div>

      {/* Features Overview */}
      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Implementation Complete</AlertTitle>
        <AlertDescription>
          All requested APIs and UI components have been implemented and are ready to use.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="gift-cards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="gift-cards">
            <Gift className="h-4 w-4 mr-2" />
            Gift Cards
          </TabsTrigger>
          <TabsTrigger value="referral">
            <Share2 className="h-4 w-4 mr-2" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="loyalty">
            <BarChart3 className="h-4 w-4 mr-2" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>

        {/* Gift Cards Tab */}
        <TabsContent value="gift-cards" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gift Card Features</CardTitle>
                <CardDescription>
                  Purchase, redeem, and manage gift cards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">APIs Implemented:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">POST</Badge>
                      /api/gift-cards/purchase
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">POST</Badge>
                      /api/gift-cards/redeem
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">GET</Badge>
                      /api/gift-cards/balance
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Purchase gift cards (50-10,000 ETB)</li>
                    <li>• Send to recipients via email</li>
                    <li>• Check balance and transaction history</li>
                    <li>• Redeem full or partial amounts</li>
                    <li>• Personal message support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div>
              <GiftCardPurchaseForm 
                onSuccess={(card) => {
                  console.log('Gift card purchased:', card)
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Referral Tab */}
        <TabsContent value="referral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Referral System</CardTitle>
                <CardDescription>
                  Share referral codes and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">APIs Implemented:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">GET</Badge>
                      /api/referral/code
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">POST</Badge>
                      /api/referral/code
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Generate unique referral codes</li>
                    <li>• Share via email or native share</li>
                    <li>• Copy code/URL to clipboard</li>
                    <li>• Track referral statistics</li>
                    <li>• Regenerate expired codes</li>
                  </ul>
                </div>
                <Button onClick={() => setReferralModalOpen(true)} className="w-full">
                  Open Referral Modal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Get Your Code</p>
                    <p className="text-sm text-muted-foreground">
                      Generate a unique referral code
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Share with Friends</p>
                    <p className="text-sm text-muted-foreground">
                      Send your code via email or social media
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Earn Rewards</p>
                    <p className="text-sm text-muted-foreground">
                      Get bonus points when they make a purchase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program</CardTitle>
              <CardDescription>
                Earn points and unlock exclusive benefits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The loyalty badge is now visible in the navbar (top right). It shows your current points and tier with a progress indicator.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-semibold">APIs Implemented:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">GET</Badge>
                    /api/loyalty/account (already existed)
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">POST</Badge>
                    /api/loyalty/account (already existed)
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl mb-2">🥉</div>
                    <p className="font-semibold">Bronze</p>
                    <p className="text-xs text-muted-foreground">0+ points</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl mb-2">🥈</div>
                    <p className="font-semibold">Silver</p>
                    <p className="text-xs text-muted-foreground">1,000+ points</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl mb-2">🥇</div>
                    <p className="font-semibold">Gold</p>
                    <p className="text-xs text-muted-foreground">5,000+ points</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl mb-2">💎</div>
                    <p className="font-semibold">Platinum</p>
                    <p className="text-xs text-muted-foreground">15,000+ points</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Comparison</CardTitle>
              <CardDescription>
                Compare products side-by-side
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">APIs Implemented:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">GET</Badge>
                    /api/products/compare
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">POST</Badge>
                    /api/products/compare
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">DELETE</Badge>
                    /api/products/compare
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">GET</Badge>
                    /api/products/compare/details
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Compare 2-4 products simultaneously</li>
                  <li>• Side-by-side price comparison</li>
                  <li>• Detailed specifications table</li>
                  <li>• Features checklist comparison</li>
                  <li>• Add to cart from comparison</li>
                  <li>• Responsive grid layout</li>
                </ul>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Access the comparison page at: <code className="bg-muted px-2 py-1 rounded">/products/compare?ids=id1,id2,id3</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReferralModal open={referralModalOpen} onOpenChange={setReferralModalOpen} />
    </div>
  )
}
