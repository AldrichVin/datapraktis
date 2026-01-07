'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  User,
} from 'lucide-react';

interface Milestone {
  title: string;
  description: string;
  amount: number;
  dueDate?: string;
}

interface ExistingProposal {
  id: string;
  coverLetter: string;
  proposedBudget: number;
  proposedDays: number;
  proposedMilestones: Milestone[];
  status: string;
  createdAt: string;
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
  template: {
    name: string;
    slug: string;
  } | null;
  client: {
    id: string;
    name: string;
    image: string | null;
    createdAt: string;
  };
  hasProposal: boolean;
  proposals: ExistingProposal[];
  _count: {
    proposals: number;
    files: number;
  };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Mencari Analyst',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default function BrowseProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);

  // Form state
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [proposedDays, setProposedDays] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', amount: 0 },
  ]);

  const projectId = params.id as string;

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (data.success) {
          setProject(data.data);

          // Pre-fill milestones from template if available
          if (data.data.template?.defaultMilestones) {
            // Template milestones would be handled here
          }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Gagal memuat proyek',
            variant: 'destructive',
          });
          if (data.error === 'Access denied') {
            router.push('/browse');
          }
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

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: 0 }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const milestonesTotal = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const budgetMatch = milestonesTotal === Number(proposedBudget);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetMatch) {
      toast({
        title: 'Error',
        description: 'Total milestone harus sama dengan budget yang diajukan',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter,
          proposedBudget: Number(proposedBudget),
          proposedDays: Number(proposedDays),
          proposedMilestones: milestones,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim proposal');
      }

      toast({
        title: 'Proposal Terkirim!',
        description: 'Klien akan mereview proposal Anda',
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/projects/${projectId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setProject(refreshData.data);
      }
      setShowProposalForm(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengirim proposal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
        <Link href="/browse">
          <Button variant="outline">Kembali ke Browse</Button>
        </Link>
      </div>
    );
  }

  const existingProposal = project.proposals[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/browse">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {project.template && (
              <Badge variant="outline">{project.template.name}</Badge>
            )}
            <Badge variant="warning">{statusLabels[project.status]}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground mt-1">
            Diposting {formatRelativeTime(project.createdAt)}
          </p>
        </div>
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

          {/* Existing Proposal */}
          {existingProposal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proposal Anda
                </CardTitle>
                <CardDescription>
                  Dikirim {formatRelativeTime(existingProposal.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      existingProposal.status === 'PENDING'
                        ? 'secondary'
                        : existingProposal.status === 'ACCEPTED'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {existingProposal.status === 'PENDING'
                      ? 'Menunggu Review'
                      : existingProposal.status === 'ACCEPTED'
                      ? 'Diterima'
                      : 'Ditolak'}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(existingProposal.proposedBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Pengerjaan</p>
                    <p className="font-medium">{existingProposal.proposedDays} hari</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Milestone</p>
                    <p className="font-medium">
                      {existingProposal.proposedMilestones.length} tahap
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {existingProposal.coverLetter}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Milestone</h4>
                  <div className="space-y-2">
                    {existingProposal.proposedMilestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                        <p className="font-medium text-primary">
                          {formatCurrency(milestone.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {existingProposal.status === 'ACCEPTED' && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Selamat! Proposal Anda diterima</p>
                      <p className="text-sm">Silakan buka halaman proyek untuk mulai bekerja</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proposal Form */}
          {!existingProposal && project.status === 'OPEN' && (
            <>
              {!showProposalForm ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Tertarik dengan proyek ini?
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Kirim proposal untuk menawarkan jasa Anda
                      </p>
                      <Button onClick={() => setShowProposalForm(true)}>
                        <Send className="mr-2 h-4 w-4" />
                        Buat Proposal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Buat Proposal</CardTitle>
                    <CardDescription>
                      Jelaskan mengapa Anda cocok untuk proyek ini
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Cover Letter */}
                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">Cover Letter *</Label>
                        <Textarea
                          id="coverLetter"
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Perkenalkan diri Anda, jelaskan pengalaman relevan, dan bagaimana Anda akan menyelesaikan proyek ini..."
                          rows={6}
                          required
                          minLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimal 50 karakter ({coverLetter.length}/50)
                        </p>
                      </div>

                      {/* Budget & Timeline */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="proposedBudget">Budget (Rp) *</Label>
                          <Input
                            id="proposedBudget"
                            type="number"
                            value={proposedBudget}
                            onChange={(e) => setProposedBudget(e.target.value)}
                            placeholder="1000000"
                            required
                            min={500000}
                          />
                          <p className="text-xs text-muted-foreground">
                            Budget klien: {formatCurrency(project.budgetMin)} -{' '}
                            {formatCurrency(project.budgetMax)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proposedDays">Waktu Pengerjaan (hari) *</Label>
                          <Input
                            id="proposedDays"
                            type="number"
                            value={proposedDays}
                            onChange={(e) => setProposedDays(e.target.value)}
                            placeholder="7"
                            required
                            min={1}
                          />
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Milestone *</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMilestone}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Tambah
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {milestones.map((milestone, index) => (
                            <div
                              key={index}
                              className="p-4 border rounded-lg space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  Milestone {index + 1}
                                </span>
                                {milestones.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMilestone(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Judul</Label>
                                  <Input
                                    value={milestone.title}
                                    onChange={(e) =>
                                      updateMilestone(index, 'title', e.target.value)
                                    }
                                    placeholder="Analisis Data"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Nilai (Rp)</Label>
                                  <Input
                                    type="number"
                                    value={milestone.amount || ''}
                                    onChange={(e) =>
                                      updateMilestone(
                                        index,
                                        'amount',
                                        Number(e.target.value)
                                      )
                                    }
                                    placeholder="500000"
                                    required
                                    min={0}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Deskripsi</Label>
                                <Textarea
                                  value={milestone.description}
                                  onChange={(e) =>
                                    updateMilestone(index, 'description', e.target.value)
                                  }
                                  placeholder="Jelaskan deliverable untuk milestone ini..."
                                  rows={2}
                                  required
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Milestones Total */}
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            proposedBudget && !budgetMatch
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted'
                          }`}
                        >
                          <span className="text-sm font-medium">Total Milestone</span>
                          <span className="font-semibold">
                            {formatCurrency(milestonesTotal)}
                          </span>
                        </div>
                        {proposedBudget && !budgetMatch && (
                          <p className="text-xs text-destructive">
                            Total milestone harus sama dengan budget yang diajukan (
                            {formatCurrency(Number(proposedBudget))})
                          </p>
                        )}
                      </div>

                      {/* Submit */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowProposalForm(false)}
                        >
                          Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !budgetMatch}>
                          {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          Kirim Proposal
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
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
                <p className="text-sm text-muted-foreground">Proposal Masuk</p>
                <p className="font-medium">{project._count.proposals} proposal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">File</p>
                <p className="font-medium">{project._count.files} file</p>
              </div>
            </CardContent>
          </Card>

          {/* Client Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tentang Klien</CardTitle>
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
                  <p className="text-sm text-muted-foreground">
                    Member sejak {formatDate(project.client.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Platform memotong 10% dari pembayaran Anda
                sebagai biaya layanan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
