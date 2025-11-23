import { useState, useEffect } from "react";
import { Star, ThumbsUp, MoreVertical, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  is_verified: boolean;
  created_at: string;
  profiles: {
    displayName: string;
  } | null;
}

interface ReviewsSectionProps {
  productId: string;
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", comment: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the expected format
        const transformedData = data.map((review: any) => ({
          ...review,
          user_id: review.userId,
          product_id: review.productId,
          helpful_count: review.helpfulCount,
          is_verified: review.isVerified,
          created_at: review.createdAt,
          profiles: review.user?.profile ? {
            displayName: review.user.profile.displayName,
          } : null,
        }));
        setReviews(transformedData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const submitReview = async () => {
    if (!user || !profile) {
      toast.error("Please log in to submit a review");
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
        }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setNewReview({ rating: 5, title: "", comment: "" });
        setShowReviewForm(false);
        fetchReviews();
      } else {
        toast.error("Failed to submit review");
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportReview = (reviewId: string) => {
    if (!user || !profile) {
      toast.error("Please log in to report a review");
      return;
    }
    setSelectedReviewId(reviewId);
    setShowReportDialog(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    if (!selectedReviewId) {
      return;
    }

    setIsReporting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/reviews/${selectedReviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.actionTaken) {
          toast.success("Review reported. Vendor has been suspended and product removed.", {
            duration: 5000,
          });
        } else {
          toast.success("Review reported successfully");
        }
        setShowReportDialog(false);
        setReportReason("");
        setSelectedReviewId(null);
        fetchReviews();
      } else {
        toast.error(data.error || "Failed to report review");
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error("Failed to report review");
    } finally {
      setIsReporting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            {user && (
              <Button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant="outline"
                size="sm"
              >
                Write Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rating Summary */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {reviews.length} reviews
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span>{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-muted rounded h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              rating <= newReview.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Title (optional)</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={newReview.title}
                      onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief summary of your review"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Review</label>
                    <Textarea
                      className="mt-1"
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience with this product..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={submitReview} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {review.profiles?.displayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {review.profiles?.displayName || "Anonymous"}
                      </span>
                      {review.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground mb-3">{review.comment}</p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        Helpful ({review.helpful_count})
                      </button>
                      {user && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleReportReview(review.id)}>
                              <Flag className="h-4 w-4 mr-2" />
                              Report Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Review Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this review. If this review has multiple reports and is rated poorly, appropriate action will be taken.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe why you're reporting this review..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReportDialog(false);
              setReportReason("");
              setSelectedReviewId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={isReporting || !reportReason.trim()}>
              {isReporting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}