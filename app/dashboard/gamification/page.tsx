'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, Trophy, Gift, Gamepad2, TrendingUp, 
  Calendar, Flame, Star, Award, Ticket, Coins 
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

// Types
interface CheckInStatus {
  checkedInToday: boolean
  currentStreak: number
  lastCheckIn: string | null
  nextReward: number
  totalCheckIns: number
}

interface Achievement {
  id?: string
  key: string
  achievementKey?: string
  achievementName?: string
  name: string
  description: string
  points: number
  iconUrl: string
  earnedAt?: string
  rewardClaimed?: boolean
}

interface Reward {
  key: string
  name: string
  description: string
  pointsCost: number
  rewardType: string
  rewardValue: number
  iconUrl: string
  canAfford: boolean
}

interface Game {
  key: string
  name: string
  description: string
  iconUrl: string
  maxPlaysPerDay: number
  playsToday: number
  canPlay: boolean
}

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  points?: number
  tier?: string
  achievementCount?: number
  achievementPoints?: number
  streak?: number
  lastCheckIn?: string
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  currentUser: {
    rank: number
    points?: number
    tier?: string
    achievementCount?: number
    achievementPoints?: number
    streak?: number
  } | null
  type: string
}

export default function GamificationPage() {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null)
  const [achievements, setAchievements] = useState<{ available: Achievement[]; earned: Achievement[]; totalPoints: number } | null>(null)
  const [rewards, setRewards] = useState<{ rewards: Reward[]; userPoints: number } | null>(null)
  const [games, setGames] = useState<{ games: Game[] } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchCheckInStatus(),
        fetchAchievements(),
        fetchRewards(),
        fetchGames(),
        fetchLeaderboard('points'),
      ])
    } catch (error) {
      console.error('Error fetching gamification data:', error)
      toast.error('Failed to load gamification data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckInStatus = async () => {
    const response = await fetch('/api/gamification/check-in')
    if (response.ok) {
      const data = await response.json()
      setCheckInStatus(data)
    }
  }

  const fetchAchievements = async () => {
    const response = await fetch('/api/gamification/achievements')
    if (response.ok) {
      const data = await response.json()
      setAchievements(data)
    }
  }

  const fetchRewards = async () => {
    const response = await fetch('/api/gamification/rewards')
    if (response.ok) {
      const data = await response.json()
      setRewards(data)
    }
  }

  const fetchGames = async () => {
    const response = await fetch('/api/gamification/games')
    if (response.ok) {
      const data = await response.json()
      setGames(data)
    }
  }

  const fetchLeaderboard = async (type: string) => {
    const response = await fetch(`/api/gamification/leaderboard?type=${type}&limit=10`)
    if (response.ok) {
      const data = await response.json()
      setLeaderboard(data)
    }
  }

  const handleCheckIn = async () => {
    try {
      const response = await fetch('/api/gamification/check-in', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        await fetchCheckInStatus()
        await fetchRewards() // Refresh rewards to show updated points
      } else {
        toast.error(data.error || 'Failed to check in')
      }
    } catch (error) {
      toast.error('Failed to check in')
    }
  }

  const handlePlayGame = async (gameType: string) => {
    try {
      const response = await fetch('/api/gamification/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, score: 0 }),
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        await fetchGames()
        await fetchRewards() // Refresh to show updated points
      } else {
        toast.error(data.error || 'Failed to play game')
      }
    } catch (error) {
      toast.error('Failed to play game')
    }
  }

  const handleRedeemReward = async (rewardKey: string) => {
    try {
      const response = await fetch('/api/gamification/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardKey }),
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        await fetchRewards()
      } else {
        toast.error(data.error || 'Failed to redeem reward')
      }
    } catch (error) {
      toast.error('Failed to redeem reward')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎮 Gamification Hub</h1>
        <p className="text-muted-foreground">Earn points, unlock achievements, and win rewards!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInStatus?.currentStreak || 0} days</div>
            <p className="text-xs text-muted-foreground">
              {checkInStatus?.totalCheckIns || 0} total check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards?.userPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Use points to redeem rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements?.earned.length || 0}/{(achievements?.available.length || 0) + (achievements?.earned.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {achievements?.totalPoints || 0} points earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{leaderboard?.currentUser?.rank || '-'}</div>
            <p className="text-xs text-muted-foreground">
              Points leaderboard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Daily Check-in */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Check-in
                  </CardTitle>
                  <CardDescription>Check in daily to build your streak and earn bonus points</CardDescription>
                </div>
                <Button 
                  onClick={handleCheckIn} 
                  disabled={checkInStatus?.checkedInToday}
                  size="lg"
                >
                  {checkInStatus?.checkedInToday ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Checked In
                    </>
                  ) : (
                    'Check In Now'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                    {checkInStatus?.currentStreak || 0} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next Reward</p>
                  <p className="text-2xl font-bold text-yellow-600">+{checkInStatus?.nextReward || 10} pts</p>
                </div>
              </div>
              
              {checkInStatus && checkInStatus.currentStreak > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Streak Milestones</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`text-center p-2 rounded ${checkInStatus.currentStreak >= 7 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      <div className="text-xs">7 Days</div>
                      <div className="font-bold">+50 pts</div>
                    </div>
                    <div className={`text-center p-2 rounded ${checkInStatus.currentStreak >= 30 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      <div className="text-xs">30 Days</div>
                      <div className="font-bold">+200 pts</div>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-100">
                      <div className="text-xs">Keep Going!</div>
                      <div className="font-bold">More Bonuses</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Quick Play
              </CardTitle>
              <CardDescription>Play games to earn instant rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {games?.games.slice(0, 3).map((game) => (
                  <Card key={game.key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="text-3xl text-center">{game.iconUrl}</div>
                      <h3 className="font-semibold text-center">{game.name}</h3>
                      <p className="text-xs text-muted-foreground text-center">{game.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span>{game.playsToday}/{game.maxPlaysPerDay} plays</span>
                        <Badge variant={game.canPlay ? 'default' : 'secondary'}>
                          {game.canPlay ? 'Play' : 'Limit Reached'}
                        </Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handlePlayGame(game.key)}
                        disabled={!game.canPlay}
                      >
                        Play Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>
                {achievements?.earned.length || 0} unlocked • {achievements?.totalPoints || 0} points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Earned Achievements */}
                {achievements && achievements.earned.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Unlocked
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {achievements.earned.map((achievement) => (
                        <Card key={achievement.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                          <CardContent className="p-4 flex items-start gap-3">
                            <div className="text-3xl">{achievement.iconUrl}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.achievementName || achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-yellow-600">+{achievement.points} pts</Badge>
                                {achievement.earnedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Achievements */}
                {achievements && achievements.available.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-gray-400" />
                      Locked
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {achievements.available.map((achievement) => (
                        <Card key={achievement.key} className="opacity-75">
                          <CardContent className="p-4 flex items-start gap-3">
                            <div className="text-3xl grayscale">{achievement.iconUrl}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              <Badge variant="outline" className="mt-2">+{achievement.points} pts</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Redeem Rewards</CardTitle>
                  <CardDescription>Use your points to unlock exclusive rewards</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Available Points</p>
                  <p className="text-2xl font-bold text-yellow-600">{rewards?.userPoints || 0}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards?.rewards.map((reward) => (
                  <Card key={reward.key} className={reward.canAfford ? 'border-green-200' : 'opacity-75'}>
                    <CardContent className="p-4 space-y-3">
                      <div className="text-4xl text-center">{reward.iconUrl}</div>
                      <div>
                        <h3 className="font-semibold text-center">{reward.name}</h3>
                        <p className="text-xs text-muted-foreground text-center">{reward.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={reward.canAfford ? 'default' : 'secondary'}>
                          {reward.pointsCost} points
                        </Badge>
                        <Badge variant="outline">{reward.rewardType.replace('_', ' ')}</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleRedeemReward(reward.key)}
                        disabled={!reward.canAfford}
                      >
                        {reward.canAfford ? 'Redeem' : 'Not Enough Points'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Games</CardTitle>
              <CardDescription>Play games daily to earn points and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {games?.games.map((game) => (
                  <Card key={game.key} className={game.canPlay ? 'border-blue-200' : 'opacity-75'}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">{game.iconUrl}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{game.name}</h3>
                          <p className="text-sm text-muted-foreground">{game.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Plays Today</span>
                          <span className="font-semibold">{game.playsToday}/{game.maxPlaysPerDay}</span>
                        </div>
                        <Progress value={(game.playsToday / game.maxPlaysPerDay) * 100} />
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => handlePlayGame(game.key)}
                        disabled={!game.canPlay}
                      >
                        {game.canPlay ? 'Play Now' : 'Daily Limit Reached'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>See how you rank against other users</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="points" onValueChange={(v) => fetchLeaderboard(v)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="points">Points</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="streaks">Streaks</TabsTrigger>
                </TabsList>

                <TabsContent value="points" className="space-y-3 mt-4">
                  {leaderboard?.currentUser && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600">Your Rank: #{leaderboard.currentUser.rank}</Badge>
                            <span className="font-semibold">{leaderboard.currentUser.points} points</span>
                            <Badge variant="outline">{leaderboard.currentUser.tier}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-2">
                    {leaderboard?.leaderboard.map((entry) => (
                      <Card key={entry.userId}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              entry.rank === 1 ? 'bg-yellow-400' : 
                              entry.rank === 2 ? 'bg-gray-300' : 
                              entry.rank === 3 ? 'bg-orange-400' : 'bg-gray-100'
                            }`}>
                              {entry.rank}
                            </div>
                            <div>
                              <p className="font-semibold">{entry.displayName}</p>
                              <p className="text-sm text-muted-foreground">{entry.points} points</p>
                            </div>
                          </div>
                          <Badge variant="outline">{entry.tier}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="achievements" className="space-y-2 mt-4">
                  {leaderboard?.leaderboard.map((entry) => (
                    <Card key={entry.userId}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1 ? 'bg-yellow-400' : 
                            entry.rank === 2 ? 'bg-gray-300' : 
                            entry.rank === 3 ? 'bg-orange-400' : 'bg-gray-100'
                          }`}>
                            {entry.rank}
                          </div>
                          <div>
                            <p className="font-semibold">{entry.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.achievementCount} achievements • {entry.achievementPoints} points
                            </p>
                          </div>
                        </div>
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="streaks" className="space-y-2 mt-4">
                  {leaderboard?.leaderboard.map((entry) => (
                    <Card key={entry.userId}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1 ? 'bg-yellow-400' : 
                            entry.rank === 2 ? 'bg-gray-300' : 
                            entry.rank === 3 ? 'bg-orange-400' : 'bg-gray-100'
                          }`}>
                            {entry.rank}
                          </div>
                          <div>
                            <p className="font-semibold">{entry.displayName}</p>
                            <p className="text-sm text-muted-foreground">{entry.streak} day streak</p>
                          </div>
                        </div>
                        <Flame className="h-5 w-5 text-orange-500" />
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
