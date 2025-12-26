'use client'

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SellerRating {
  id: string;
  communication: number;
  shippingSpeed: number;
  accuracy: number;
  customerService: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
  user: {
    displayName: string;
  };
}

interface RatingStatistics {
  totalRatings: number;
  averageOverallRating: number;
  averageCommunication: number;
  averageShippingSpeed: number;
  averageAccuracy: number;
  averageCustomerService: number;
}

interface SellerRatingsDisplayProps {
  vendorId: string;
  showTitle?: boolean;
  maxRatings?: number;
}

export function SellerRatingsDisplay({ 
  vendorId, 
  showTitle = true,
  maxRatings = 10 
}: SellerRatingsDisplayProps) {
  const [ratings, setRatings] = useState<SellerRating[]>([]);
  const [statistics, setStatistics] = useState<RatingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, [vendorId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/seller-ratings?vendorId=${vendorId}&perPage=${maxRatings}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }

      const data = await response.json();
      setRatings(data.ratings || []);
      setStatistics(data.statistics || null);
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
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

  const renderCategoryRating = (label: string, value: number, icon?: React.ReactNode) => {
    const percentage = (value / 5) * 100;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          <span className="font-semibold">{value.toFixed(1)}/5</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle>Seller Ratings</CardTitle>}
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle>Seller Ratings</CardTitle>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || statistics.totalRatings === 0) {
    return (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle>Seller Ratings</CardTitle>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ratings yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          {showTitle && <CardTitle>Seller Ratings</CardTitle>}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating Summary */}
          <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <span className="text-4xl font-bold">
                  {statistics.averageOverallRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {statistics.totalRatings} {statistics.totalRatings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              {renderCategoryRating('Communication', statistics.averageCommunication)}
              {renderCategoryRating('Shipping Speed', statistics.averageShippingSpeed)}
              {renderCategoryRating('Accuracy', statistics.averageAccuracy)}
              {renderCategoryRating('Customer Service', statistics.averageCustomerService)}
            </div>
          </div>

          {/* Rating Quality Badge */}
          {statistics.averageOverallRating >= 4.5 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Excellent Seller Rating
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      {rating.user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rating.user.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rating.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(rating.overallRating)}
                        <span className="ml-1 text-sm font-semibold">
                          {rating.overallRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Category Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Communication:</span>
                        <span className="font-medium">{rating.communication}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span className="font-medium">{rating.shippingSpeed}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="font-medium">{rating.accuracy}/5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">{rating.customerService}/5</span>
                      </div>
                    </div>

                    {rating.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
