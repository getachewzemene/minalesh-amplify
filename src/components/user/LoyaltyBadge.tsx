'use client'

import { useEffect, useState } from 'react'
import { Trophy, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/auth-context'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'

interface LoyaltyData {
  points: number
  tier: string
  nextTierPoints: number
  lifetimePoints: number
}

const TIER_COLORS = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-white',
  platinum: 'bg-purple-500 text-white',
}

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}

export function LoyaltyBadge() {
  const { user } = useAuth()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchLoyaltyData()
    }
  }, [user])

  const fetchLoyaltyData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/loyalty/account')
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData({
          points: data.points,
          tier: data.tier,
          nextTierPoints: data.nextTierPoints,
          lifetimePoints: data.lifetimePoints,
        })
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !loyaltyData) {
    return null
  }

  const tierColor = TIER_COLORS[loyaltyData.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze
  const tierIcon = TIER_ICONS[loyaltyData.tier as keyof typeof TIER_ICONS] || TIER_ICONS.bronze
  const progress = loyaltyData.nextTierPoints > 0
    ? Math.min(100, (loyaltyData.points / (loyaltyData.points + loyaltyData.nextTierPoints)) * 100)
    : 100

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Badge variant="secondary" className={`${tierColor} flex items-center gap-1 cursor-pointer`}>
            <Trophy className="h-3 w-3" />
            <span className="hidden sm:inline">{loyaltyData.points}</span>
            <span className="sm:hidden">{loyaltyData.points}</span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tierIcon}</span>
              <div>
                <p className="font-semibold capitalize">{loyaltyData.tier} Member</p>
                <p className="text-sm text-muted-foreground">{loyaltyData.points} points</p>
              </div>
            </div>
          </div>

          {loyaltyData.nextTierPoints > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to next tier</span>
                <span className="font-medium">{loyaltyData.nextTierPoints} pts to go</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Lifetime Points: {loyaltyData.lifetimePoints}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
