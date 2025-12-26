'use client'

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SellerRatingFormProps {
  orderId: string;
  vendorId: string;
  vendorName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface RatingCategory {
  key: 'communication' | 'shippingSpeed' | 'accuracy' | 'customerService';
  label: string;
  description: string;
}

const ratingCategories: RatingCategory[] = [
  {
    key: 'communication',
    label: 'Communication',
    description: 'How well did the seller communicate during the order process?'
  },
  {
    key: 'shippingSpeed',
    label: 'Shipping Speed',
    description: 'How quickly did the seller process and ship your order?'
  },
  {
    key: 'accuracy',
    label: 'Order Accuracy',
    description: 'How accurately did the order match the description?'
  },
  {
    key: 'customerService',
    label: 'Customer Service',
    description: 'What was the quality of customer service provided?'
  }
];

export function SellerRatingForm({ 
  orderId, 
  vendorId, 
  vendorName,
  onSuccess,
  onCancel 
}: SellerRatingFormProps) {
  const [ratings, setRatings] = useState({
    communication: 0,
    shippingSpeed: 0,
    accuracy: 0,
    customerService: 0
  });
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{
    category: string;
    value: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = (category: RatingCategory['key'], value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    // Validate all ratings are set
    const allRated = Object.values(ratings).every(rating => rating > 0);
    if (!allRated) {
      toast.error('Please rate all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/seller-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          vendorId,
          ...ratings,
          comment: comment.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      toast.success('Rating submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: RatingCategory['key'], currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const isHovered = hoveredRating?.category === category && value <= hoveredRating.value;
          const isFilled = value <= currentRating;
          const shouldFill = isHovered || isFilled;

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingClick(category, value)}
              onMouseEnter={() => setHoveredRating({ category, value })}
              onMouseLeave={() => setHoveredRating(null)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  shouldFill
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          );
        })}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating > 0 ? `${currentRating}/5` : 'Not rated'}
        </span>
      </div>
    );
  };

  const overallRating = Object.values(ratings).reduce((sum, val) => sum + val, 0) / 4;
  const hasAllRatings = Object.values(ratings).every(rating => rating > 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rate Your Experience with {vendorName}</CardTitle>
        <CardDescription>
          Your feedback helps other customers and improves seller service quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Categories */}
        <div className="space-y-6">
          {ratingCategories.map((category) => (
            <div key={category.key} className="space-y-2">
              <Label className="text-base font-semibold">{category.label}</Label>
              <p className="text-sm text-muted-foreground">{category.description}</p>
              {renderStars(category.key, ratings[category.key])}
            </div>
          ))}
        </div>

        {/* Overall Rating Display */}
        {hasAllRatings && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Overall Rating:</span>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold">{overallRating.toFixed(2)}/5</span>
              </div>
            </div>
          </div>
        )}

        {/* Comment Section */}
        <div className="space-y-2">
          <Label htmlFor="comment">Additional Comments (Optional)</Label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this seller..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasAllRatings}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
