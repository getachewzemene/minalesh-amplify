'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Share2, TrendingUp, Award, Target, 
  MessageCircle, Facebook, Twitter, Copy, QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

interface SocialStats {
  totalShares: number;
  sharesByPlatform: Record<string, number>;
  pointsFromSharing: number;
  currentTier: string;
  totalPoints: number;
  recentShares: any[];
  recentTransactions: any[];
  milestones: Array<{
    shares: number;
    reward: number;
    achieved: boolean;
  }>;
  nextMilestone: {
    shares: number;
    reward: number;
    achieved: boolean;
  } | null;
}

export default function SocialDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/social');
      return;
    }
    fetchStats();
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/social/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      whatsapp: MessageCircle,
      facebook: Facebook,
      twitter: Twitter,
      telegram: MessageCircle,
      copy_link: Copy,
      qr_code: QrCode,
      native: Share2,
    };
    const Icon = icons[platform] || Share2;
    return <Icon className="h-4 w-4" />;
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      facebook: 'Facebook',
      twitter: 'Twitter',
      telegram: 'Telegram',
      copy_link: 'Copy Link',
      qr_code: 'QR Code',
      native: 'Native Share',
    };
    return labels[platform] || platform;
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-200 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[tier] || colors.bronze;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const progressToNext = stats.nextMilestone
    ? (stats.totalShares / stats.nextMilestone.shares) * 100
    : 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Sharing Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sharing activity and earn rewards!
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.totalShares}</span>
                <Share2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Points Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.pointsFromSharing}</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From sharing products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loyalty Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getTierColor(stats.currentTier)}>
                {stats.currentTier.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {stats.totalPoints} points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Next Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.nextMilestone ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.nextMilestone.shares}</span>
                    <span className="text-sm text-muted-foreground">shares</span>
                  </div>
                  <p className="text-xs text-green-600 font-semibold mt-2">
                    +{stats.nextMilestone.reward} points reward
                  </p>
                </>
              ) : (
                <p className="text-sm">All milestones achieved! 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Milestones Progress */}
        {stats.nextMilestone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Milestone Progress
              </CardTitle>
              <CardDescription>
                {stats.totalShares} / {stats.nextMilestone.shares} shares to next reward
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressToNext} className="h-3 mb-4" />
              <p className="text-sm text-muted-foreground">
                {stats.nextMilestone.shares - stats.totalShares} more shares to earn {stats.nextMilestone.reward} bonus points!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Milestones Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Sharing Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    milestone.achieved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-2xl font-bold">{milestone.shares}</p>
                      <p className="text-xs text-muted-foreground">shares</p>
                    </div>
                    {milestone.achieved && (
                      <Badge variant="default" className="bg-green-600">
                        <Award className="h-3 w-3 mr-1" />
                        Achieved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-green-700">
                    +{milestone.reward} points
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Shares by Platform</CardTitle>
            <CardDescription>Your sharing activity across different platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.sharesByPlatform)
                .filter(([_, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getPlatformIcon(platform)}
                      </div>
                      <span className="font-medium">{getPlatformLabel(platform)}</span>
                    </div>
                    <Badge variant="outline">{count} shares</Badge>
                  </div>
                ))}
              {Object.values(stats.sharesByPlatform).every(c => c === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No shares yet. Start sharing products to earn rewards!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Shares */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentShares.slice(0, 5).map((share) => (
                  <div key={share.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(share.platform)}
                      <span className="truncate max-w-[200px]">
                        {share.product.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {stats.recentShares.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent shares
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Points */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Points Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      +{tx.points}
                    </Badge>
                  </div>
                ))}
                {stats.recentTransactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent points earned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earn More Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>💡 <strong>Share on social media:</strong> WhatsApp, Facebook, Twitter (5 points each)</p>
            <p>💡 <strong>Copy link:</strong> Quick share via copy link (2 points)</p>
            <p>💡 <strong>QR Code:</strong> Generate QR codes for easy sharing (3 points)</p>
            <p>💡 <strong>Reach milestones:</strong> Bonus points at 10, 25, 50, 100, and 250 shares!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
