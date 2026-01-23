'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Container } from '@/components/ui/container'
import { ReferralModal } from '@/components/user/ReferralModal'
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  Gift, 
  Share2,
  Calendar,
  Mail,
  TrendingUp,
  Award
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

// Import points rates for consistency
const POINTS_RATES = {
  referralReferrer: 100,
  referralReferee: 50,
}

interface ReferralStats {
  totalReferrals: number
  registeredReferrals: number
  completedReferrals: number
  totalRewards: number
  pendingReferrals: number
}

interface Referral {
  id: string
  code: string
  status: 'pending' | 'registered' | 'completed' | 'expired'
  createdAt: string
  completedAt: string | null
  rewardIssued: boolean
  referee: {
    email: string
    name: string | null
  } | null
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [referralModalOpen, setReferralModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/referral/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setReferrals(data.referrals)
      } else {
        throw new Error('Failed to fetch referral data')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      registered: 'default',
      completed: 'default',
      expired: 'destructive',
    } as const

    const colors = {
      pending: 'text-yellow-600',
      registered: 'text-blue-600',
      completed: 'text-green-600',
      expired: 'text-gray-600',
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className={colors[status as keyof typeof colors]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    )
  }

  return (
    <>
      <Navbar />
      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Referral Program</h1>
              <p className="text-muted-foreground mt-2">
                Invite friends and earn rewards when they make their first purchase
              </p>
            </div>
            <Button onClick={() => setReferralModalOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Code
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                  <p className="text-xs text-muted-foreground">
                    All time referrals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registered</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.registeredReferrals}</div>
                  <p className="text-xs text-muted-foreground">
                    Signed up, pending purchase
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completedReferrals}</div>
                  <p className="text-xs text-muted-foreground">
                    Made first purchase
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalRewards}</div>
                  <p className="text-xs text-muted-foreground">
                    Loyalty points earned
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Referral List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                Track the status of people you've referred to Minalesh
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading referrals...
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start sharing your referral code to invite friends!
                  </p>
                  <Button onClick={() => setReferralModalOpen(true)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Referral Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {referral.referee?.name || referral.referee?.email || 'Pending signup'}
                          </span>
                          {getStatusBadge(referral.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Invited {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {referral.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span>
                                Completed {formatDistanceToNow(new Date(referral.completedAt), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {referral.rewardIssued && (
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                            <Gift className="h-4 w-4" />
                            <span>{POINTS_RATES.referralReferrer} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold">1. Share Your Code</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral code with friends via email, social media, or messaging.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold">2. Friend Signs Up</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When they register using your code, they get {POINTS_RATES.referralReferee} loyalty points as a welcome bonus.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">3. Earn Rewards</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When they make their first purchase, you earn {POINTS_RATES.referralReferrer} loyalty points that you can use for discounts!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>

      <ReferralModal open={referralModalOpen} onOpenChange={setReferralModalOpen} />

      <Footer />
    </>
  )
}
