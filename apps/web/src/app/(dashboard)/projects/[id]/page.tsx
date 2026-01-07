'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Star,
  Upload,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/files/file-upload';

interface Proposal {
  id: string;
  coverLetter: string;
  proposedBudget: number;
  proposedDays: number;
  proposedMilestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate?: string;
  }>;
  status: string;
  createdAt: string;
  analyst: {
    id: string;
    name: string;
    image: string | null;
    analystProfile: {
      headline: string;
      rating: number;
      completedProjects: number;
      responseTimeHours: number | null;
    } | null;
  };
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  dueDate: string | null;
  sortOrder: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string | null;
  templateAnswers: Record<string, unknown> | null;
  createdAt: string;
  hiredAt: string | null;
  template: {
    name: string;
    slug: string;
  } | null;
  client: {
    id: string;
    name: string;
    image: string | null;
  };
  proposals: Proposal[];
  milestones: Milestone[];
  isClient: boolean;
  isHiredAnalyst: boolean;
  _count: {
    proposals: number;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  }, [projectId, toast]);

  const handleProposalAction = async (proposalId: string, action: 'accept' | 'reject') => {
    setActionLoading(proposalId);
    try {
      const res = await fetch(`/api/projects/${projectId}/proposals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update proposal');
      }

      toast({
        title: action === 'accept' ? 'Proposal Diterima!' : 'Proposal Ditolak',
        description: data.message,
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/projects/${projectId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setProject(refreshData.data);
      }
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
        <Link href="/projects">
          <Button variant="outline">Kembali ke Daftar Proyek</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects">
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
            Diposting {formatRelativeTime(project.createdAt)}
          </p>
        </div>
        {project.isClient && project.status === 'IN_PROGRESS' && (
          <Link href={`/messages?project=${projectId}`}>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat dengan Analyst
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {/* Milestones (if in progress) */}
          {project.status === 'IN_PROGRESS' && project.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Milestone</CardTitle>
                <CardDescription>Progress pengerjaan proyek</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-lg border',
                        milestone.status === 'APPROVED' && 'bg-green-50 border-green-200',
                        milestone.status === 'IN_PROGRESS' && 'bg-blue-50 border-blue-200'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                          milestone.status === 'APPROVED'
                            ? 'bg-green-500 text-white'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {milestone.status === 'APPROVED' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <Badge variant="outline">
                            {milestoneStatusLabels[milestone.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="font-medium text-primary">
                            {formatCurrency(milestone.amount)}
                          </span>
                          {milestone.dueDate && (
                            <span className="text-muted-foreground">
                              <Calendar className="inline h-4 w-4 mr-1" />
                              {formatDate(milestone.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposals (if open and client) */}
          {project.isClient && project.status === 'OPEN' && (
            <Card>
              <CardHeader>
                <CardTitle>Proposal ({project.proposals.length})</CardTitle>
                <CardDescription>
                  Review proposal dari analyst yang tertarik
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.proposals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada proposal masuk</p>
                    <p className="text-sm">Analyst akan segera mengirim proposal</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {project.proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        {/* Analyst Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={proposal.analyst.image || ''} />
                              <AvatarFallback>
                                {proposal.analyst.name?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{proposal.analyst.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {proposal.analyst.analystProfile?.headline || 'Data Analyst'}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                {(proposal.analyst.analystProfile?.rating ?? 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {proposal.analyst.analystProfile?.rating?.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-muted-foreground">
                                  {proposal.analyst.analystProfile?.completedProjects || 0} proyek
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              proposal.status === 'PENDING'
                                ? 'secondary'
                                : proposal.status === 'ACCEPTED'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {proposal.status === 'PENDING'
                              ? 'Menunggu'
                              : proposal.status === 'ACCEPTED'
                              ? 'Diterima'
                              : 'Ditolak'}
                          </Badge>
                        </div>

                        {/* Cover Letter */}
                        <div>
                          <h5 className="text-sm font-medium mb-1">Cover Letter</h5>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {proposal.coverLetter}
                          </p>
                        </div>

                        {/* Proposal Details */}
                        <div className="grid gap-4 sm:grid-cols-3 p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-semibold text-primary">
                              {formatCurrency(proposal.proposedBudget)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Waktu Pengerjaan</p>
                            <p className="font-medium">{proposal.proposedDays} hari</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Milestone</p>
                            <p className="font-medium">
                              {proposal.proposedMilestones.length} tahap
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {proposal.status === 'PENDING' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleProposalAction(proposal.id, 'accept')}
                              disabled={actionLoading === proposal.id}
                              className="flex-1"
                            >
                              {actionLoading === proposal.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Terima Proposal
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleProposalAction(proposal.id, 'reject')}
                              disabled={actionLoading === proposal.id}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Proyek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl font-semibold text-primary">
                  {formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}
                </p>
              </div>
              {project.deadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.deadline)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Proposal</p>
                <p className="font-medium">{project._count.proposals} diterima</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File</p>
                <p className="font-medium">{project._count.files} file</p>
              </div>
            </CardContent>
          </Card>

          {/* File Upload (for client) */}
          {project.isClient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload File
                </CardTitle>
                <CardDescription>
                  Upload data atau dokumen untuk proyek ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  projectId={project.id}
                  accessLevel="PUBLIC_PREVIEW"
                  onUploadComplete={(file) => {
                    toast({
                      title: 'File berhasil diupload',
                      description: file.originalName,
                    });
                    // Refresh project to update file count
                    fetch(`/api/projects/${projectId}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.success) setProject(data.data);
                      });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Client Card (for hired analyst) */}
          {project.isHiredAnalyst && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Klien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.client.image || ''} />
                    <AvatarFallback>
                      {project.client.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.client.name}</p>
                    <p className="text-sm text-muted-foreground">Klien</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
