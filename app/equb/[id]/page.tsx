'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Calendar, Coins, TrendingUp, CheckCircle2, 
  AlertCircle, UserPlus, History 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EqubCircleDetail {
  id: string;
  name: string;
  description: string;
  memberLimit: number;
  contributionAmount: number;
  frequency: string;
  startDate: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  creator: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  members: Array<{
    id: string;
    userId: string;
    position: number;
    isActive: boolean;
    joinedAt: string;
    user: {
      id: string;
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  }>;
  contributions: any[];
  distributions: any[];
  totalPot: number;
  spotsRemaining: number;
  isFull: boolean;
}

export default function EqubDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [equbCircle, setEqubCircle] = useState<EqubCircleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchEqubCircle();
    }
  }, [params.id]);

  useEffect(() => {
    if (equbCircle && user) {
      const memberExists = equbCircle.members.some(m => m.userId === user.id);
      setIsMember(memberExists);
      setContributionAmount(equbCircle.contributionAmount);
    }
  }, [equbCircle, user]);

  const fetchEqubCircle = async () => {
    try {
      const response = await fetch(`/api/equb/circles/${params.id}/join`);
      const result = await response.json();
      
      if (result.success) {
        setEqubCircle(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load Equb circle',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching Equb circle:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Equb circle',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to join this Equb circle',
      });
      router.push(`/auth/login?redirect=/equb/${params.id}`);
      return;
    }

    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/equb/circles/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        await fetchEqubCircle();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to join Equb circle',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error joining Equb circle:', error);
      toast({
        title: 'Error',
        description: 'Failed to join Equb circle',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setContributing(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/equb/circles/${params.id}/contribute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: contributionAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Contribution Recorded!',
          description: result.data.message,
        });
        setContributeDialogOpen(false);
        await fetchEqubCircle();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to record contribution',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error contributing:', error);
      toast({
        title: 'Error',
        description: 'Failed to record contribution',
        variant: 'destructive',
      });
    } finally {
      setContributing(false);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly - በሳምንት',
      biweekly: 'Bi-weekly - በሁለት ሳምንት',
      monthly: 'Monthly - በወር',
    };
    return labels[freq] || freq;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!equbCircle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Equb Circle Not Found</h3>
            <Button onClick={() => router.push('/equb')}>
              Browse Equb Circles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (equbCircle.members.length / equbCircle.memberLimit) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/equb" className="hover:text-foreground">Equb Circles</a>
          <span>/</span>
          <span>{equbCircle.name}</span>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={equbCircle.isFull ? 'default' : 'secondary'}>
            {equbCircle.isFull ? 'Full Circle' : 'Open for Members'}
          </Badge>
          <Badge variant="outline">
            Round {equbCircle.currentRound}/{equbCircle.totalRounds}
          </Badge>
          <Badge variant="outline">{equbCircle.status}</Badge>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{equbCircle.name}</CardTitle>
                <CardDescription>{equbCircle.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Coins className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{equbCircle.contributionAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">ETB per round</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{equbCircle.totalPot.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total pot</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">{equbCircle.members.length}/{equbCircle.memberLimit}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold">{equbCircle.totalRounds}</p>
                    <p className="text-xs text-muted-foreground">Rounds</p>
                  </div>
                </div>

                <Separator />

                {/* Circle Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{getFrequencyLabel(equbCircle.frequency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{new Date(equbCircle.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">
                      {equbCircle.creator.profile?.firstName} {equbCircle.creator.profile?.lastName}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Circle Members ({equbCircle.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equbCircle.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {(member.user.profile?.firstName?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.user.profile?.firstName || 'User'} {member.user.profile?.lastName || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Position #{member.position} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {member.isActive && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Join or Contribute</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{equbCircle.members.length} members</span>
                    <span className="font-semibold">{equbCircle.memberLimit} total</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  {equbCircle.spotsRemaining > 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {equbCircle.spotsRemaining} spots remaining
                    </p>
                  )}
                </div>

                {!isMember && !equbCircle.isFull && (
                  <Button 
                    className="w-full flex items-center gap-2" 
                    onClick={handleJoinCircle}
                    disabled={joining}
                  >
                    <UserPlus className="h-4 w-4" />
                    {joining ? 'Joining...' : 'Join Circle'}
                  </Button>
                )}

                {isMember && (
                  <>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        You are a member!
                      </p>
                    </div>
                    <Dialog open={contributeDialogOpen} onOpenChange={setContributeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full flex items-center gap-2">
                          <Coins className="h-4 w-4" />
                          Make Contribution
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleContribute}>
                          <DialogHeader>
                            <DialogTitle>Make Contribution</DialogTitle>
                            <DialogDescription>
                              Contribute to round {equbCircle.currentRound + 1}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="amount">Amount (ETB)</Label>
                            <Input
                              id="amount"
                              type="number"
                              min={equbCircle.contributionAmount}
                              step="50"
                              value={contributionAmount}
                              onChange={(e) => setContributionAmount(parseFloat(e.target.value))}
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Minimum: {equbCircle.contributionAmount.toLocaleString()} ETB
                            </p>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setContributeDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={contributing}>
                              {contributing ? 'Processing...' : 'Contribute'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>1. Each member contributes {equbCircle.contributionAmount.toLocaleString()} ETB {equbCircle.frequency}</p>
                <p>2. The full pot ({equbCircle.totalPot.toLocaleString()} ETB) goes to one member per round</p>
                <p>3. Distribution follows position order</p>
                <p>4. Cycle completes when everyone receives once</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
