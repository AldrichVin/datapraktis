'use client';

import {
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MilestoneStatus =
  | 'PENDING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'DISPUTED';

interface MilestoneStatusBadgeProps {
  status: MilestoneStatus;
  className?: string;
}

const statusConfig: Record<
  MilestoneStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  PENDING: {
    label: 'Belum Dimulai',
    variant: 'outline',
    icon: Clock,
    description: 'Milestone menunggu giliran',
  },
  FUNDED: {
    label: 'Siap Dikerjakan',
    variant: 'secondary',
    icon: Clock,
    description: 'Milestone siap dikerjakan',
  },
  IN_PROGRESS: {
    label: 'Dikerjakan',
    variant: 'default',
    icon: Loader2,
    description: 'Analyst sedang mengerjakan',
  },
  SUBMITTED: {
    label: 'Menunggu Review',
    variant: 'warning',
    icon: Send,
    description: 'Menunggu persetujuan klien',
  },
  REVISION_REQUESTED: {
    label: 'Revisi Diminta',
    variant: 'destructive',
    icon: RotateCcw,
    description: 'Klien meminta revisi',
  },
  APPROVED: {
    label: 'Selesai',
    variant: 'success',
    icon: CheckCircle2,
    description: 'Milestone disetujui',
  },
  DISPUTED: {
    label: 'Sengketa',
    variant: 'destructive',
    icon: AlertCircle,
    description: 'Terjadi sengketa',
  },
};

export function MilestoneStatusBadge({
  status,
  className,
}: MilestoneStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant as any}
      className={cn('gap-1.5', className)}
      title={config.description}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          status === 'IN_PROGRESS' && 'animate-spin'
        )}
      />
      {config.label}
    </Badge>
  );
}

// Export a compact version for lists
export function MilestoneStatusDot({
  status,
  className,
}: {
  status: MilestoneStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const colorClasses: Record<MilestoneStatus, string> = {
    PENDING: 'text-muted-foreground',
    FUNDED: 'text-green-600',
    IN_PROGRESS: 'text-blue-600',
    SUBMITTED: 'text-yellow-600',
    REVISION_REQUESTED: 'text-red-600',
    APPROVED: 'text-green-600',
    DISPUTED: 'text-red-600',
  };

  return (
    <Icon
      className={cn('h-4 w-4', colorClasses[status], className)}
    />
  );
}
