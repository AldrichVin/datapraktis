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
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  X,
} from 'lucide-react';

interface Withdrawal {
  id: string;
  analystId: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: string;
  processedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  analyst: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusColors: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
};

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchWithdrawals = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/admin/withdrawals?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setWithdrawals(data.data.withdrawals);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleAction = async (
    withdrawalId: string,
    action: 'approve' | 'complete' | 'reject'
  ) => {
    setActionLoading(withdrawalId);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses');
      }

      toast({
        title: 'Berhasil',
        description: data.message,
      });

      fetchWithdrawals(pagination?.page || 1);
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

  // Calculate totals for current filter
  const totalAmount = withdrawals
    .filter((w) => statusFilter === 'ALL' || w.status === statusFilter)
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground">Kelola permintaan penarikan dana</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => {
          const count = withdrawals.filter(
            (w) => statusFilter === 'ALL' || w.status === status
          ).length;
          return (
            <Card
              key={status}
              className={statusFilter === status ? 'border-primary' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {statusLabels[status]}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Badge variant={statusColors[status]}>
                    {statusLabels[status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'Semua' : statusLabels[status]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Withdrawals</CardTitle>
          <CardDescription>
            Total: {formatCurrency(totalAmount)} dari {pagination?.total || 0}{' '}
            permintaan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada withdrawal</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={withdrawal.analyst?.image || ''} />
                        <AvatarFallback>
                          {withdrawal.analyst?.name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {formatCurrency(withdrawal.amount)}
                          </p>
                          <Badge variant={statusColors[withdrawal.status]}>
                            {statusLabels[withdrawal.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.analyst?.name || 'Unknown'} •{' '}
                          {withdrawal.analyst?.email}
                        </p>
                        <div className="mt-2 text-sm">
                          <p className="font-medium">
                            {withdrawal.bankName} - {withdrawal.bankAccountNumber}
                          </p>
                          <p className="text-muted-foreground">
                            a.n. {withdrawal.bankAccountName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Dibuat: {formatRelativeTime(withdrawal.createdAt)}
                          {withdrawal.processedAt && (
                            <> • Diproses: {formatRelativeTime(withdrawal.processedAt)}</>
                          )}
                          {withdrawal.completedAt && (
                            <> • Selesai: {formatRelativeTime(withdrawal.completedAt)}</>
                          )}
                        </p>
                        {withdrawal.failureReason && (
                          <p className="text-xs text-destructive mt-1">
                            Alasan: {withdrawal.failureReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {withdrawal.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(withdrawal.id, 'approve')}
                            disabled={actionLoading === withdrawal.id}
                          >
                            {actionLoading === withdrawal.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(withdrawal.id, 'reject')}
                            disabled={actionLoading === withdrawal.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}
                      {withdrawal.status === 'PROCESSING' && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(withdrawal.id, 'complete')}
                          disabled={actionLoading === withdrawal.id}
                        >
                          {actionLoading === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Selesai
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchWithdrawals(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchWithdrawals(pagination.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
