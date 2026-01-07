'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Star } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  qualityRating: number | null;
  communicationRating: number | null;
  timelinessRating: number | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
  project: {
    id: string;
    title: string;
  };
}

interface ReviewListProps {
  userId?: string;
  projectId?: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-200'
          )}
        />
      ))}
    </div>
  );
}

export function ReviewList({ userId, projectId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        if (projectId) params.set('projectId', projectId);

        const res = await fetch(`/api/reviews?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [userId, projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 border rounded-lg space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={review.reviewer.image || ''} />
                <AvatarFallback>
                  {review.reviewer.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{review.reviewer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {review.reviewer.role === 'CLIENT' ? 'Klien' : 'Analyst'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <StarDisplay rating={review.rating} />
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(review.createdAt)}
              </p>
            </div>
          </div>

          {/* Project */}
          <p className="text-sm text-muted-foreground">
            Proyek: {review.project.title}
          </p>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm">{review.comment}</p>
          )}

          {/* Detailed Ratings */}
          {(review.qualityRating ||
            review.communicationRating ||
            review.timelinessRating) && (
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              {review.qualityRating && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Kualitas:</span>
                  <StarDisplay rating={review.qualityRating} />
                </div>
              )}
              {review.communicationRating && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Komunikasi:</span>
                  <StarDisplay rating={review.communicationRating} />
                </div>
              )}
              {review.timelinessRating && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Ketepatan:</span>
                  <StarDisplay rating={review.timelinessRating} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
