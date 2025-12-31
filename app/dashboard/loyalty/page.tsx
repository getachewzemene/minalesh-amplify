'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Award, Gift, TrendingUp, Star, ShoppingBag, MessageSquare, Users } from 'lucide-react'
import { format } from 'date-fns'

interface LoyaltyAccount {
  id: string
  points: number
  lifetimePoints: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  nextTierPoints: number
  createdAt: string
}

interface LoyaltyTransaction {
  id: string
  points: number
  type: string
  description: string
  createdAt: string
  expiresAt: string | null
}

const tierConfig = {
  bronze: {
    name: 'Bronze',
    color: 'bg-amber-700',
    textColor: 'text-amber-700',
    minPoints: 0,
    nextTier: 'Silver',
    nextPoints: 1000,
    benefits: ['1 point per 10 ETB spent', 'Birthday bonus'],
  },
  silver: {
    name: 'Silver',
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    minPoints: 1000,
    nextTier: 'Gold',
    nextPoints: 5000,
    benefits: ['1.5 points per 10 ETB', 'Free shipping on orders over 500 ETB', 'Birthday bonus'],
  },
  gold: {
    name: 'Gold',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    minPoints: 5000,
    nextTier: 'Platinum',
    nextPoints: 10000,
    benefits: ['2 points per 10 ETB', 'Free shipping', 'Priority support', 'Exclusive deals'],
  },
  platinum: {
    name: 'Platinum',
    color: 'bg-purple-600',
    textColor: 'text-purple-600',
    minPoints: 10000,
    nextTier: null,
    nextPoints: null,
    benefits: ['3 points per 10 ETB', 'Free express shipping', 'VIP support', 'Early access to sales'],
  },
}

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      // Fetch account
      const accountResponse = await fetch('/api/loyalty/account', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        setAccount(accountData)
      }

      // Fetch transactions
      const transactionsResponse = await fetch('/api/loyalty/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data')
    } finally {
      setLoading(false)
    }
  }

  const getTierInfo = (tier: string) => {
    return tierConfig[tier as keyof typeof tierConfig] || tierConfig.bronze
  }

  const getProgressToNextTier = () => {
    if (!account) return 0
    const tierInfo = getTierInfo(account.tier)
    if (!tierInfo.nextPoints) return 100
    
    const currentTierMin = tierInfo.minPoints
    const nextTierMin = tierInfo.nextPoints
    const progress = ((account.lifetimePoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />
      case 'review':
        return <MessageSquare className="h-4 w-4" />
      case 'referral':
        return <Users className="h-4 w-4" />
      case 'redeem':
        return <Gift className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-6xl text-center">
        <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Unable to Load Loyalty Program</h2>
        <p className="text-muted-foreground">{error || 'Please try again later'}</p>
      </div>
    )
  }

  const tierInfo = getTierInfo(account.tier)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Loyalty Rewards</h1>
        <p className="text-muted-foreground">
          Earn points with every purchase and unlock exclusive benefits
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Current Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{account.points.toLocaleString()}</span>
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Redeem for discounts and rewards
            </p>
          </CardContent>
        </Card>

        {/* Lifetime Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{account.lifetimePoints.toLocaleString()}</span>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total points earned all-time
            </p>
          </CardContent>
        </Card>

        {/* Current Tier */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membership Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <Award className={`h-8 w-8 ${tierInfo.textColor}`} />
              <Badge className={`${tierInfo.color} text-white text-lg px-3 py-1`}>
                {tierInfo.name}
              </Badge>
            </div>
            {tierInfo.nextTier && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {tierInfo.nextPoints - account.lifetimePoints} points to {tierInfo.nextTier}
                </p>
                <Progress value={getProgressToNextTier()} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="benefits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="benefits">Tier Benefits</TabsTrigger>
          <TabsTrigger value="history">Points History</TabsTrigger>
          <TabsTrigger value="earn">How to Earn</TabsTrigger>
        </TabsList>

        {/* Tier Benefits */}
        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your {tierInfo.name} Benefits</CardTitle>
              <CardDescription>
                Enjoy these exclusive benefits as a {tierInfo.name} member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tierInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`rounded-full p-1 ${tierInfo.color}`}>
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* All Tiers Overview */}
          <Card>
            <CardHeader>
              <CardTitle>All Membership Tiers</CardTitle>
              <CardDescription>See what you can unlock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(tierConfig).map(([key, tier]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border-2 ${
                      account.tier === key ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${tier.color} text-white`}>
                        {tier.name}
                      </Badge>
                      {account.tier === key && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {tier.minPoints.toLocaleString()}+ lifetime points
                    </p>
                    <ul className="text-sm space-y-1">
                      {tier.benefits.slice(0, 2).map((benefit, idx) => (
                        <li key={idx} className="text-muted-foreground">• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>Your recent point transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <p>No transactions yet. Start shopping to earn points!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          transaction.points > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </p>
                          {transaction.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {format(new Date(transaction.expiresAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold ${
                        transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* How to Earn */}
        <TabsContent value="earn">
          <Card>
            <CardHeader>
              <CardTitle>Ways to Earn Points</CardTitle>
              <CardDescription>Maximize your rewards with these activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="rounded-full p-3 bg-blue-100">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Make Purchases</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn points based on your tier when you shop
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-full p-3 bg-purple-100">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Write Reviews</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn 50 points for each verified product review
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-full p-3 bg-green-100">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Refer Friends</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn 200 points when a friend makes their first purchase
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-full p-3 bg-yellow-100">
                    <Gift className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Birthday Bonus</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive 100 bonus points on your birthday
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
