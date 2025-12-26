'use client'

import { useState, useEffect } from 'react';
import { Star, Package, ShoppingCart, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorStats {
  vendor: {
    id: string;
    displayName: string;
    status: string;
    memberSince: string;
  };
  verification: {
    status: string;
    verifiedAt?: string;
  };
  ratings: {
    totalRatings: number;
    averageOverallRating: number | null;
    averageCommunication: number | null;
    averageShippingSpeed: number | null;
    averageAccuracy: number | null;
    averageCustomerService: number | null;
  };
  products: {
    totalActive: number;
  };
  sales: {
    totalItemsSold: number;
  };
}

interface VendorStatsCardProps {
  vendorId: string;
  compact?: boolean;
}

export function VendorStatsCard({ vendorId, compact = false }: VendorStatsCardProps) {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [vendorId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/stats?vendorId=${vendorId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch vendor stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching vendor stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return null;
  }

  const verificationBadge = () => {
    if (stats.verification.status === 'approved') {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return <Badge variant="secondary">Not Verified</Badge>;
  };

  const ratingStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{stats.vendor.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(stats.vendor.memberSince).getFullYear()}
              </p>
            </div>
            {verificationBadge()}
          </div>

          {stats.ratings.averageOverallRating !== null && (
            <div className="flex items-center gap-2 mb-2">
              {ratingStars(stats.ratings.averageOverallRating)}
              <span className="text-sm font-semibold">
                {stats.ratings.averageOverallRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.ratings.totalRatings} ratings)
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>{stats.products.totalActive} products</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span>{stats.sales.totalItemsSold} sold</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Seller Information</CardTitle>
          {verificationBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vendor Info */}
        <div>
          <h3 className="font-semibold text-lg mb-1">{stats.vendor.displayName}</h3>
          <p className="text-sm text-muted-foreground">
            Member since {new Date(stats.vendor.memberSince).toLocaleDateString()}
          </p>
        </div>

        {/* Rating Summary */}
        {stats.ratings.averageOverallRating !== null ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {ratingStars(stats.ratings.averageOverallRating)}
              <span className="text-2xl font-bold">
                {stats.ratings.averageOverallRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.ratings.totalRatings} {stats.ratings.totalRatings === 1 ? 'rating' : 'ratings'})
              </span>
            </div>

            {/* Category Ratings */}
            <div className="space-y-2">
              {stats.ratings.averageCommunication !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Communication</span>
                    <span>{stats.ratings.averageCommunication.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(stats.ratings.averageCommunication / 5) * 100} className="h-1.5" />
                </div>
              )}
              {stats.ratings.averageShippingSpeed !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Shipping Speed</span>
                    <span>{stats.ratings.averageShippingSpeed.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(stats.ratings.averageShippingSpeed / 5) * 100} className="h-1.5" />
                </div>
              )}
              {stats.ratings.averageAccuracy !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Accuracy</span>
                    <span>{stats.ratings.averageAccuracy.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(stats.ratings.averageAccuracy / 5) * 100} className="h-1.5" />
                </div>
              )}
              {stats.ratings.averageCustomerService !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Customer Service</span>
                    <span>{stats.ratings.averageCustomerService.toFixed(1)}/5</span>
                  </div>
                  <Progress value={(stats.ratings.averageCustomerService / 5) * 100} className="h-1.5" />
                </div>
              )}
            </div>

            {stats.ratings.averageOverallRating >= 4.5 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  Top Rated Seller
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ratings yet</p>
        )}

        {/* Sales Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">Products</span>
            </div>
            <p className="text-lg font-semibold">{stats.products.totalActive}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs">Items Sold</span>
            </div>
            <p className="text-lg font-semibold">{stats.sales.totalItemsSold}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
