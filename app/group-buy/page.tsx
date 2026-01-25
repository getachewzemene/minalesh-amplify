'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Users, Clock, TrendingDown, Share2 } from 'lucide-react';
import { useToast } from '@/src/hooks/use-toast';

interface GroupPurchase {
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
  members: any[];
}

export default function GroupBuyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [groupPurchases, setGroupPurchases] = useState<GroupPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupPurchases();
  }, []);

  const fetchGroupPurchases = async () => {
    try {
      const response = await fetch('/api/social/group-purchase/create?limit=20');
      const result = await response.json();
      
      if (result.success) {
        setGroupPurchases(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load group purchases',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching group purchases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group purchases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = expiry.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Group Buying - የቡድን ግዢ</h1>
        <p className="text-muted-foreground">
          Team up with others to unlock amazing discounts! Perfect for Ethiopian እኩብ (Equb) culture.
        </p>
      </div>

      {groupPurchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Group Purchases</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start a group purchase and invite your friends!
            </p>
            <Button onClick={() => router.push('/products')}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groupPurchases.map((groupPurchase) => {
            const progress = getProgressPercentage(
              groupPurchase.currentMembers,
              groupPurchase.requiredMembers
            );
            const spotsLeft = groupPurchase.maxMembers
              ? groupPurchase.maxMembers - groupPurchase.currentMembers
              : null;
            const isComplete = groupPurchase.currentMembers >= groupPurchase.requiredMembers;

            return (
              <Card
                key={groupPurchase.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/group-buy/${groupPurchase.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isComplete ? 'default' : 'secondary'}>
                      {isComplete ? 'Complete!' : 'Active'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {calculateTimeRemaining(groupPurchase.expiresAt)}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{groupPurchase.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {groupPurchase.description || groupPurchase.product.name}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Product Image */}
                    {groupPurchase.product.images?.[0] && (
                      <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={groupPurchase.product.images[0].url}
                          alt={groupPurchase.product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          {groupPurchase.pricePerPerson.toLocaleString()} ETB
                        </span>
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {groupPurchase.regularPrice.toLocaleString()} ETB
                        </span>
                      </div>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {Math.round(groupPurchase.discount)}% OFF
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {groupPurchase.currentMembers} / {groupPurchase.requiredMembers} members
                        </span>
                        {spotsLeft !== null && spotsLeft > 0 && (
                          <span className="text-muted-foreground">
                            {spotsLeft} spots left
                          </span>
                        )}
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Started by {groupPurchase.initiator.profile?.firstName || 'User'}
                  </div>
                  <Button size="sm" className="flex items-center gap-1">
                    {isComplete ? 'View Details' : 'Join Group'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            How Group Buying Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 list-decimal list-inside">
            <li className="text-sm">Join an active group purchase or start your own</li>
            <li className="text-sm">Invite friends to join and unlock the group discount</li>
            <li className="text-sm">Once the required members join, everyone gets the discounted price</li>
            <li className="text-sm">Orders are created automatically when the group is complete</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-sm font-semibold mb-1">🇪🇹 Perfect for Ethiopian Equb Culture</p>
            <p className="text-xs text-muted-foreground">
              Group buying mirrors the traditional Ethiopian Equb system - pooling resources for better deals!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
