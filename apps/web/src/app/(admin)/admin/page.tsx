'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  ArrowRight,
  CreditCard,
  DollarSign,
  FolderOpen,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    clients: number;
    analysts: number;
    newThisMonth: number;
  };
  projects: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
  };
  revenue: {
    totalPlatformFees: number;
    thisMonth: number;
    pendingWithdrawals: number;
  };
  recentProjects: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    client: { name: string };
  }>;
  pendingWithdrawals: Array<{
    id: string;
    amount: number;
    createdAt: string;
    status: string;
  }>;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusColors: Record<string, BadgeVariant> = {
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview platform DataPraktis</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.clients} klien • {stats.users.analysts} analyst
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.projects.open} open • {stats.projects.inProgress} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.totalPlatformFees)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.revenue.thisMonth)} bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.pendingWithdrawals)}
            </div>
            <p className="text-xs text-muted-foreground">
              Menunggu persetujuan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Pengguna baru bulan ini</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{stats.users.newThisMonth}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total: {stats.users.total} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Project Stats</CardTitle>
              <CardDescription>Distribusi status proyek</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Open</span>
                <span className="font-medium">{stats.projects.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-medium">{stats.projects.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <span className="font-medium">{stats.projects.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>5 proyek terbaru</CardDescription>
            </div>
            <Link href="/admin/projects">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.client.name} • {formatRelativeTime(project.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusColors[project.status]}>
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Withdrawals</CardTitle>
              <CardDescription>Menunggu approval</CardDescription>
            </div>
            <Link href="/admin/withdrawals">
              <Button variant="ghost" size="sm">
                Kelola
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.pendingWithdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada withdrawal pending
              </p>
            ) : (
              <div className="space-y-4">
                {stats.pendingWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(withdrawal.createdAt)}
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
