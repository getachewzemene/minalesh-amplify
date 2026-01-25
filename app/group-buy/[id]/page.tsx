'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Separator } from '@/src/components/ui/separator';
import { 
  Users, Clock, TrendingDown, Share2, CheckCircle2, 
  AlertCircle, Copy, MessageCircle 
} from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';
import { useAuth } from '@/src/context/AuthContext';

interface GroupPurchaseDetail {
  id: string;
  title: string;
  description: string;
  productId: string;
  requiredMembers: number;
  maxMembers: number | null;
  currentMembers: number;
  pricePerPerson: number;
  regularPrice: number;
  discount: number;
  expiresAt: string;
  status: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    images: any[];
    category: {
      name: string;
    };
  };
  initiator: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  members: Array<{
    id: string;
    userId: string;
    isPaid: boolean;
    joinedAt: string;
    user: {
      id: string;
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  }>;
  timeRemaining: {
    hours: number;
    minutes: number;
    milliseconds: number;
  };
  spotsRemaining: number | null;
  isComplete: boolean;
}

export default function GroupPurchaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [groupPurchase, setGroupPurchase] = useState<GroupPurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchGroupPurchase();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchGroupPurchase, 30000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  useEffect(() => {
    if (groupPurchase && user) {
      const memberExists = groupPurchase.members.some(m => m.userId === user.id);
      setIsMember(memberExists);
    }
  }, [groupPurchase, user]);

  const fetchGroupPurchase = async () => {
    try {
      const response = await fetch(`/api/social/group-purchase/${params.id}`);
      const result = await response.json();
      
      if (result.success) {
        setGroupPurchase(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load group purchase',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching group purchase:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group purchase',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to join this group purchase',
      });
      router.push(`/auth/login?redirect=/group-buy/${params.id}`);
      return;
    }

    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/social/group-purchase/${params.id}/join`, {
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
        // Refresh the data
        await fetchGroupPurchase();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to join group purchase',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error joining group purchase:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group purchase',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/group-buy/${params.id}`;
    const shareText = `Join my group purchase for ${groupPurchase?.product.name} and get ${Math.round(groupPurchase?.discount || 0)}% off! Only ${groupPurchase?.pricePerPerson} ETB per person.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: groupPurchase?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: 'Link Copied!',
        description: 'Share link copied to clipboard',
      });
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/group-buy/${params.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link Copied!',
      description: 'Group purchase link copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!groupPurchase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Group Purchase Not Found</h3>
            <Button onClick={() => router.push('/group-buy')}>
              Browse Active Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = Math.min((groupPurchase.currentMembers / groupPurchase.requiredMembers) * 100, 100);
  const savingsPerPerson = groupPurchase.regularPrice - groupPurchase.pricePerPerson;
  const isExpired = groupPurchase.timeRemaining.milliseconds <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/group-buy" className="hover:text-foreground">Group Buying</a>
          <span>/</span>
          <span>{groupPurchase.title}</span>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={groupPurchase.isComplete ? 'default' : 'secondary'}>
            {groupPurchase.isComplete ? 'Complete!' : groupPurchase.status}
          </Badge>
          {isExpired && (
            <Badge variant="destructive">Expired</Badge>
          )}
          {!isExpired && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {groupPurchase.timeRemaining.hours}h {groupPurchase.timeRemaining.minutes}m remaining
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            {Math.round(groupPurchase.discount)}% OFF
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{groupPurchase.title}</CardTitle>
                <CardDescription>{groupPurchase.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Image */}
                {groupPurchase.product.images?.[0] && (
                  <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={groupPurchase.product.images[0].url}
                      alt={groupPurchase.product.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                {/* Product Details */}
                <div>
                  <h3 className="font-semibold mb-2">{groupPurchase.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {groupPurchase.product.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline">{groupPurchase.product.category.name}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Group Price:</span>
                    <span className="text-3xl font-bold text-primary">
                      {groupPurchase.pricePerPerson.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Regular Price:</span>
                    <span className="text-lg line-through text-muted-foreground">
                      {groupPurchase.regularPrice.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold">You Save:</span>
                    <span className="text-lg font-bold text-green-600">
                      {savingsPerPerson.toLocaleString()} ETB ({Math.round(groupPurchase.discount)}%)
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
                  Group Members ({groupPurchase.currentMembers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupPurchase.members.map((member, index) => (
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
                            {index === 0 && ' (Initiator)'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {member.isPaid && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Paid
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
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{groupPurchase.currentMembers} members</span>
                    <span className="font-semibold">
                      {groupPurchase.requiredMembers} needed
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {groupPurchase.spotsRemaining !== null && groupPurchase.spotsRemaining > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {groupPurchase.spotsRemaining} spots remaining
                  </p>
                )}

                {groupPurchase.isComplete && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Group Complete!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Orders will be processed automatically
                    </p>
                  </div>
                )}

                {!groupPurchase.isComplete && !isExpired && !isMember && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleJoinGroup}
                    disabled={joining}
                  >
                    {joining ? 'Joining...' : 'Join Group Purchase'}
                  </Button>
                )}

                {isMember && !groupPurchase.isComplete && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      You're in!
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Invite friends to complete the group faster
                    </p>
                  </div>
                )}

                <Separator />

                {/* Share Buttons */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share with Friends
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-base">Ethiopian Equb Style</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Just like traditional እኩብ (Equb), we pool our resources together to get better deals. 
                  Everyone benefits when we work together! 🇪🇹
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
