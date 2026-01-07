'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewList } from '@/components/reviews/review-list';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  dueDate: string | null;
  sortOrder: number;
  revisionCount: number;
  maxRevisions: number;
  submittedAt: string | null;
  approvedAt: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string | null;
  createdAt: string;
  hiredAt: string | null;
  completedAt: string | null;
  template: {
    name: string;
    slug: string;
  } | null;
  client: {
    id: string;
    name: string;
    image: string | null;
  };
  milestones: Milestone[];
  isClient: boolean;
  isHiredAnalyst: boolean;
  _count: {
    files: number;
  };
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Mencari Analyst',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const statusColors: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

const milestoneStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Dikerjakan',
  SUBMITTED: 'Menunggu Review',
  REVISION_REQUESTED: 'Revisi',
  APPROVED: 'Selesai',
  DISPUTED: 'Sengketa',
};

const milestoneStatusColors: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  SUBMITTED: 'warning',
  REVISION_REQUESTED: 'destructive',
  APPROVED: 'success',
  DISPUTED: 'destructive',
};

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (data.success) {
          setProject(data.data);
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Gagal memuat proyek',
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat proyek',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProject();
  }, [projectId, toast, router]);

  const handleMilestoneAction = async (
    milestoneId: string,
    action: 'submit' | 'approve' | 'request_revision'
  ) => {
    setActionLoading(milestoneId);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(action === 'request_revision' && { revisionNote }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update milestone');
      }

      toast({
        title: 'Berhasil',
        description: data.message,
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/projects/${projectId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setProject(refreshData.data);
      }

      setShowRevisionForm(null);
      setRevisionNote('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memproses',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Proyek tidak ditemukan</h2>
        <Link href="/dashboard">
          <Button variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Calculate progress
  const completedMilestones = project.milestones.filter(
    (m) => m.status === 'APPROVED'
  ).length;
  const progressPercent = Math.round(
    (completedMilestones / project.milestones.length) * 100
  );
  const totalBudget = project.milestones.reduce((sum, m) => sum + m.amount, 0);
  const completedBudget = project.milestones
    .filter((m) => m.status === 'APPROVED')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={project.isClient ? '/projects' : '/dashboard'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {project.template && (
              <Badge variant="outline">{project.template.name}</Badge>
            )}
            <Badge variant={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">
            Dimulai {formatRelativeTime(project.hiredAt || project.createdAt)}
          </p>
        </div>
        <Link href={`/messages?project=${projectId}`}>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Pesan
          </Button>
        </Link>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{progressPercent}%</p>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Milestone</p>
              <p className="text-2xl font-bold">
                {completedMilestones}/{project.milestones.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">selesai</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dana Dicairkan</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(completedBudget)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                dari {formatCurrency(totalBudget)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              {project.deadline ? (
                <>
                  <p className="text-2xl font-bold">
                    {formatDate(project.deadline)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(project.deadline) > new Date()
                      ? 'tersisa'
                      : 'lewat'}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Milestones */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Milestone</h2>
          {project.milestones.map((milestone, index) => (
            <Card
              key={milestone.id}
              className={cn(
                milestone.status === 'APPROVED' && 'border-green-200 bg-green-50/50',
                milestone.status === 'IN_PROGRESS' && 'border-blue-200 bg-blue-50/50',
                milestone.status === 'SUBMITTED' && 'border-yellow-200 bg-yellow-50/50',
                milestone.status === 'REVISION_REQUESTED' &&
                  'border-red-200 bg-red-50/50'
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                      milestone.status === 'APPROVED'
                        ? 'bg-green-500 text-white'
                        : milestone.status === 'IN_PROGRESS'
                        ? 'bg-blue-500 text-white'
                        : milestone.status === 'SUBMITTED'
                        ? 'bg-yellow-500 text-white'
                        : milestone.status === 'REVISION_REQUESTED'
                        ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {milestone.status === 'APPROVED' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{milestone.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                      <Badge variant={milestoneStatusColors[milestone.status]}>
                        {milestoneStatusLabels[milestone.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-primary">
                        {formatCurrency(milestone.amount)}
                      </span>
                      {milestone.dueDate && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(milestone.dueDate)}
                        </span>
                      )}
                      {milestone.revisionCount > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <RotateCcw className="h-4 w-4" />
                          Revisi {milestone.revisionCount}/{milestone.maxRevisions}
                        </span>
                      )}
                    </div>

                    {/* Analyst Actions */}
                    {project.isHiredAnalyst && (
                      <>
                        {(milestone.status === 'IN_PROGRESS' ||
                          milestone.status === 'REVISION_REQUESTED') && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() =>
                                handleMilestoneAction(milestone.id, 'submit')
                              }
                              disabled={actionLoading === milestone.id}
                            >
                              {actionLoading === milestone.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              Submit untuk Review
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Client Actions */}
                    {project.isClient && milestone.status === 'SUBMITTED' && (
                      <>
                        {showRevisionForm === milestone.id ? (
                          <div className="space-y-3 pt-2">
                            <Textarea
                              value={revisionNote}
                              onChange={(e) => setRevisionNote(e.target.value)}
                              placeholder="Jelaskan apa yang perlu direvisi..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowRevisionForm(null);
                                  setRevisionNote('');
                                }}
                              >
                                Batal
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleMilestoneAction(
                                    milestone.id,
                                    'request_revision'
                                  )
                                }
                                disabled={actionLoading === milestone.id}
                              >
                                {actionLoading === milestone.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                Minta Revisi
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() =>
                                handleMilestoneAction(milestone.id, 'approve')
                              }
                              disabled={actionLoading === milestone.id}
                            >
                              {actionLoading === milestone.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Setujui & Cairkan Dana
                            </Button>
                            {milestone.revisionCount < milestone.maxRevisions && (
                              <Button
                                variant="outline"
                                onClick={() => setShowRevisionForm(milestone.id)}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Minta Revisi
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Status info */}
                    {milestone.status === 'APPROVED' && milestone.approvedAt && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Disetujui {formatRelativeTime(milestone.approvedAt)}
                      </p>
                    )}
                    {milestone.status === 'SUBMITTED' && milestone.submittedAt && (
                      <p className="text-sm text-yellow-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Disubmit {formatRelativeTime(milestone.submittedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Info Proyek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Klien</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.client.image || ''} />
                    <AvatarFallback>
                      {project.client.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{project.client.name}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File</p>
                <p className="font-medium">{project._count.files} file</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/messages?project=${projectId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Kirim Pesan
                </Button>
              </Link>
              <Link href={`/projects/${projectId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Lihat Detail Proyek
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Completion Notice */}
          {project.status === 'COMPLETED' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Proyek Selesai!</p>
                    <p className="text-sm">
                      {project.completedAt &&
                        formatRelativeTime(project.completedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          {project.status === 'COMPLETED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Review
                </CardTitle>
                <CardDescription>
                  Berikan penilaian untuk proyek ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  projectId={projectId}
                  onSuccess={() => {
                    // Refresh to show updated reviews
                    window.location.reload();
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
