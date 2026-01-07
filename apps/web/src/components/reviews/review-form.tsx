'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  projectId: string;
  onSuccess?: () => void;
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                (hovered || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ projectId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Pilih rating keseluruhan',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          rating,
          comment: comment || undefined,
          qualityRating: qualityRating || undefined,
          communicationRating: communicationRating || undefined,
          timelinessRating: timelinessRating || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim review');
      }

      toast({
        title: 'Berhasil',
        description: data.message,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengirim review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overall Rating */}
      <StarRating
        value={rating}
        onChange={setRating}
        label="Rating Keseluruhan *"
      />

      {/* Detailed Ratings */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StarRating
          value={qualityRating}
          onChange={setQualityRating}
          label="Kualitas Hasil"
        />
        <StarRating
          value={communicationRating}
          onChange={setCommunicationRating}
          label="Komunikasi"
        />
        <StarRating
          value={timelinessRating}
          onChange={setTimelinessRating}
          label="Ketepatan Waktu"
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Komentar (opsional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda bekerja sama..."
          rows={4}
        />
        {comment && comment.length < 10 && (
          <p className="text-xs text-muted-foreground">
            Minimal 10 karakter ({comment.length}/10)
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kirim Review
      </Button>
    </form>
  );
}
