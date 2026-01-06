'use client';

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
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock data - will be replaced with real API calls
const clientStats = {
  activeProjects: 2,
  pendingProposals: 5,
  completedProjects: 8,
  totalSpent: 45000000,
};

const analystStats = {
  activeProjects: 3,
  pendingProposals: 2,
  completedProjects: 15,
  totalEarnings: 67500000,
  rating: 4.8,
  responseTime: '2 jam',
};

const recentProjects = [
  {
    id: '1',
    title: 'Analisis Penjualan Q4 2024',
    status: 'IN_PROGRESS',
    budget: 5000000,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Dashboard Marketing Campaign',
    status: 'OPEN',
    budget: 8000000,
    proposals: 3,
    createdAt: '2024-01-18',
  },
];

const availableProjects = [
  {
    id: '3',
    title: 'Data Cleaning untuk E-commerce',
    client: 'Toko Online ABC',
    budget: 3000000,
    deadline: '7 hari',
    skills: ['Excel', 'Python', 'Data Cleaning'],
  },
  {
    id: '4',
    title: 'Forecasting Inventory',
    client: 'PT Retail Maju',
    budget: 12000000,
    deadline: '14 hari',
    skills: ['Python', 'Forecasting', 'SQL'],
  },
];

function ClientDashboard() {
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
            <div className="text-2xl font-bold">{clientStats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposal Masuk</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Menunggu review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyek Selesai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">Total berhasil</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investasi</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(clientStats.totalSpent)}</div>
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
                    {project.proposals && (
                      <>
                        <span>•</span>
                        <span>{project.proposals} proposal</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  variant={project.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                >
                  {project.status === 'IN_PROGRESS' ? 'Dikerjakan' : 'Mencari Analyst'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalystDashboard() {
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
            <div className="text-2xl font-bold">{analystStats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposal Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analystStats.pendingProposals}</div>
            <p className="text-xs text-muted-foreground">Menunggu response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analystStats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Dari {analystStats.completedProjects} proyek</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {analystStats.rating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Response: {analystStats.responseTime}</p>
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
                  <div className="flex flex-wrap gap-1">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold text-primary">
                    {formatCurrency(project.budget)}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {project.deadline}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pesan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">3 pesan belum dibaca</p>
                <p className="text-sm text-muted-foreground">Dari 2 klien berbeda</p>
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
                <span className="font-medium">75%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: '75%' }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Tambahkan portfolio untuk meningkatkan peluang
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
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  if (userRole === 'ANALYST') {
    return <AnalystDashboard />;
  }

  return <ClientDashboard />;
}
