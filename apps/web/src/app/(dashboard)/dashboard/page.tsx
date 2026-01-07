'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface ClientStats {
  activeProjects: number;
  pendingProposals: number;
  completedProjects: number;
  totalSpent: number;
}

interface ClientProject {
  id: string;
  title: string;
  status: string;
  budget: number;
  proposals: number;
  createdAt: string;
}

interface ClientDashboardData {
  stats: ClientStats;
  recentProjects: ClientProject[];
}

interface AnalystStats {
  activeProjects: number;
  pendingProposals: number;
  completedProjects: number;
  totalEarnings: number;
  rating: number;
  totalReviews: number;
}

interface AvailableProject {
  id: string;
  title: string;
  client: string;
  budget: number;
  deadline: number | null;
  createdAt: string;
}

interface AnalystDashboardData {
  stats: AnalystStats;
  profileCompletion: number;
  unreadMessages: number;
  availableProjects: AvailableProject[];
}

function ClientDashboard() {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats || {
    activeProjects: 0,
    pendingProposals: 0,
    completedProjects: 0,
    totalSpent: 0,
  };
  const recentProjects = data?.recentProjects || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola proyek dan temukan analyst terbaik untuk bisnis Anda
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Posting Proyek Baru
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyek Aktif</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposal Masuk</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Menunggu review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyek Selesai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">Total berhasil</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investasi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Untuk data analytics</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proyek Terbaru</CardTitle>
              <CardDescription>Status proyek yang sedang berjalan</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Belum ada proyek</p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Proyek Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatCurrency(project.budget)}</span>
                      {project.proposals > 0 && (
                        <>
                          <span>•</span>
                          <span>{project.proposals} proposal</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      project.status === 'IN_PROGRESS'
                        ? 'default'
                        : project.status === 'COMPLETED'
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {project.status === 'IN_PROGRESS'
                      ? 'Dikerjakan'
                      : project.status === 'COMPLETED'
                      ? 'Selesai'
                      : 'Mencari Analyst'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalystDashboard() {
  const [data, setData] = useState<AnalystDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats || {
    activeProjects: 0,
    pendingProposals: 0,
    completedProjects: 0,
    totalEarnings: 0,
    rating: 0,
    totalReviews: 0,
  };
  const profileCompletion = data?.profileCompletion || 0;
  const unreadMessages = data?.unreadMessages || 0;
  const availableProjects = data?.availableProjects || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Temukan proyek baru dan kelola pekerjaan Anda
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyek Aktif</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposal Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Menunggu response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Dari {stats.completedProjects} proyek</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.rating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReviews} review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proyek Tersedia</CardTitle>
              <CardDescription>Proyek yang cocok dengan skill Anda</CardDescription>
            </div>
            <Link href="/browse">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {availableProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada proyek tersedia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border"
                >
                  <div className="space-y-2">
                    <Link
                      href={`/browse/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(project.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold text-primary">
                      {formatCurrency(project.budget)}
                    </span>
                    {project.deadline !== null && project.deadline > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {project.deadline} hari
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pesan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                {unreadMessages > 0 ? (
                  <>
                    <p className="font-medium">{unreadMessages} pesan belum dibaca</p>
                    <p className="text-sm text-muted-foreground">Balas untuk response cepat</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Tidak ada pesan baru</p>
                    <p className="text-sm text-muted-foreground">Semua pesan sudah dibaca</p>
                  </>
                )}
              </div>
            </div>
            <Link href="/messages" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Buka Pesan
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lengkapi Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kelengkapan profil</span>
                <span className="font-medium">{profileCompletion}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {profileCompletion < 100
                  ? 'Tambahkan portfolio untuk meningkatkan peluang'
                  : 'Profil Anda sudah lengkap!'}
              </p>
            </div>
            <Link href="/analyst/profile" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Edit Profil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userRole = session?.user?.role;

  if (userRole === 'ANALYST') {
    return <AnalystDashboard />;
  }

  return <ClientDashboard />;
}
