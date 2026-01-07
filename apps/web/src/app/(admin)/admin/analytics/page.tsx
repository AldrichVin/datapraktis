'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Analytics {
  usersOverTime: Array<{
    role: string;
    _count: number;
  }>;
  projectsByStatus: Array<{
    status: string;
    _count: number;
  }>;
  revenueByDay: Array<{
    date: string;
    amount: number;
    fee: number;
  }>;
  topTemplates: Array<{
    templateId: string | null;
    name: string;
    count: number;
  }>;
  topAnalysts: Array<{
    id: string;
    name: string | null;
    image: string | null;
    completedProjects: number;
    rating: number;
  }>;
  metrics: {
    avgProjectValueMin: number;
    avgProjectValueMax: number;
    conversionRate: number;
    avgHireTimeDays: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  OPEN: 'bg-yellow-400',
  IN_PROGRESS: 'bg-blue-400',
  COMPLETED: 'bg-green-400',
  CANCELLED: 'bg-red-400',
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat data analytics</p>
      </div>
    );
  }

  // Calculate totals
  const totalRevenue = analytics.revenueByDay.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const totalFees = analytics.revenueByDay.reduce((sum, d) => sum + d.fee, 0);
  const totalProjects = analytics.projectsByStatus.reduce(
    (sum, s) => sum + s._count,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Insight dan metrik platform
          </p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p} Hari
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total GMV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform fee: {formatCurrency(totalFees)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.metrics.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Projects completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Project Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.metrics.avgProjectValueMin)}
            </div>
            <p className="text-xs text-muted-foreground">
              to {formatCurrency(analytics.metrics.avgProjectValueMax)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.metrics.avgHireTimeDays} hari
            </div>
            <p className="text-xs text-muted-foreground">
              From posting to hiring
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Distribusi status proyek</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.projectsByStatus.map((status) => {
                const percentage =
                  totalProjects > 0
                    ? ((status._count / totalProjects) * 100).toFixed(0)
                    : 0;
                return (
                  <div key={status.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{status.status}</span>
                      <span className="font-medium">
                        {status._count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColors[status.status]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Templates</CardTitle>
            <CardDescription>Template paling banyak digunakan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topTemplates.map((template, index) => (
                <div
                  key={template.templateId || index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <Badge variant="secondary">{template.count} proyek</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Analysts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Analysts</CardTitle>
            <CardDescription>Analyst dengan proyek terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topAnalysts.map((analyst, index) => (
                <div
                  key={analyst.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={analyst.image || ''} alt={analyst.name || ''} />
                      <AvatarFallback>
                        {analyst.name?.[0]?.toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{analyst.name || 'No Name'}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {analyst.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <Badge>{analyst.completedProjects} selesai</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart (Simple) */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Total transaksi per hari</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.revenueByDay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data transaksi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.revenueByDay.slice(-10).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(day.date).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            (day.amount /
                              Math.max(
                                ...analytics.revenueByDay.map((d) => d.amount)
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-32 text-right">
                      {formatCurrency(day.amount)}
                    </span>
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
