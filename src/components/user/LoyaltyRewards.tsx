'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gift, Star, Trophy, Zap, Crown } from 'lucide-react'

interface LoyaltyLevel {
  name: string
  minPoints: number
  icon: React.ReactNode
  color: string
  benefits: string[]
}

const LOYALTY_LEVELS: LoyaltyLevel[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    icon: <Star className="h-5 w-5" />,
    color: 'text-amber-700',
    benefits: ['5% discount on purchases', 'Early access to sales']
  },
  {
    name: 'Silver',
    minPoints: 500,
    icon: <Trophy className="h-5 w-5" />,
    color: 'text-gray-400',
    benefits: ['10% discount on purchases', 'Free shipping on orders over 1000 ETB', 'Priority customer support']
  },
  {
    name: 'Gold',
    minPoints: 1500,
    icon: <Zap className="h-5 w-5" />,
    color: 'text-yellow-500',
    benefits: ['15% discount on purchases', 'Free shipping on all orders', 'Exclusive products access', 'Birthday rewards']
  },
  {
    name: 'Platinum',
    minPoints: 5000,
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-500',
    benefits: ['20% discount on purchases', 'VIP customer support', 'Personal shopping assistant', 'Exclusive events invitations']
  }
]

export function LoyaltyRewards({ userId }: { userId?: string }) {
  const [points, setPoints] = useState(0)
  const [currentLevel, setCurrentLevel] = useState<LoyaltyLevel>(LOYALTY_LEVELS[0])
  const [nextLevel, setNextLevel] = useState<LoyaltyLevel | null>(LOYALTY_LEVELS[1])
  const [progressToNext, setProgressToNext] = useState(0)

  useEffect(() => {
    // Calculate user's loyalty points based on orders
    // For now, using a mock calculation
    const mockPoints = Math.floor(Math.random() * 2000)
    setPoints(mockPoints)

    // Determine current level
    const level = [...LOYALTY_LEVELS]
      .reverse()
      .find(l => mockPoints >= l.minPoints) || LOYALTY_LEVELS[0]
    
    setCurrentLevel(level)

    // Determine next level
    const currentIndex = LOYALTY_LEVELS.findIndex(l => l.name === level.name)
    const next = currentIndex < LOYALTY_LEVELS.length - 1 ? LOYALTY_LEVELS[currentIndex + 1] : null
    setNextLevel(next)

    // Calculate progress
    if (next) {
      const pointsInCurrentTier = mockPoints - level.minPoints
      const pointsNeededForNext = next.minPoints - level.minPoints
      const progress = (pointsInCurrentTier / pointsNeededForNext) * 100
      setProgressToNext(Math.min(progress, 100))
    } else {
      setProgressToNext(100)
    }
  }, [userId])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Loyalty Rewards
          </CardTitle>
          <CardDescription>Earn points with every purchase and unlock exclusive benefits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ${currentLevel.color}`}>
                {currentLevel.icon}
              </div>
              <div>
                <p className="font-semibold text-lg">{currentLevel.name} Member</p>
                <p className="text-sm text-muted-foreground">{points} points</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {points} pts
            </Badge>
          </div>

          {/* Progress to Next Level */}
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
                <span className="font-medium">
                  {nextLevel.minPoints - points} pts to go
                </span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}

          {/* Current Level Benefits */}
          <div>
            <p className="font-medium mb-2">Your Benefits</p>
            <ul className="space-y-2">
              {currentLevel.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* All Levels Overview */}
          <div>
            <p className="font-medium mb-3">Membership Tiers</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LOYALTY_LEVELS.map((level, index) => (
                <div
                  key={level.name}
                  className={`p-3 border rounded-lg text-center ${
                    level.name === currentLevel.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className={`mx-auto w-8 h-8 flex items-center justify-center mb-2 ${level.color}`}>
                    {level.icon}
                  </div>
                  <p className="font-medium text-sm">{level.name}</p>
                  <p className="text-xs text-muted-foreground">{level.minPoints}+ pts</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn Points */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-medium mb-2 text-sm">How to Earn Points</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 1 point per 1 ETB spent</li>
              <li>• 50 bonus points for leaving a review</li>
              <li>• 100 bonus points on your birthday</li>
              <li>• 200 bonus points for referring a friend</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
