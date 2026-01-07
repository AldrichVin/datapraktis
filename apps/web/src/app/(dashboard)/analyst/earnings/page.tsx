'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  AlertCircle,
  ArrowDownToLine,
  BanknoteIcon,
  Clock,
  CreditCard,
  Loader2,
  Wallet,
} from 'lucide-react';

interface BankInfo {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

interface Balance {
  total: number;
  withdrawn: number;
  pending: number;
  available: number;
}

interface Withdrawal {
  id: string;
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
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
};

const statusColors: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

export default function EarningsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/analyst/withdrawals');
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance);
        setBankInfo(data.data.bankInfo);
        setWithdrawals(data.data.withdrawals);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(withdrawAmount);
    if (amount < 100000) {
      toast({
        title: 'Error',
        description: 'Minimum penarikan Rp 100.000',
        variant: 'destructive',
      });
      return;
    }

    if (balance && amount > balance.available) {
      toast({
        title: 'Error',
        description: 'Saldo tidak mencukupi',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/analyst/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat permintaan penarikan');
      }

      toast({
        title: 'Berhasil',
        description: data.message,
      });

      setWithdrawAmount('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memproses',
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

  const hasBankInfo =
    bankInfo?.bankName && bankInfo?.bankAccountNumber && bankInfo?.bankAccountName;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pendapatan</h1>
        <p className="text-muted-foreground">Kelola pendapatan dan penarikan dana</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(balance?.total || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BanknoteIcon className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">Tersedia</p>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {formatCurrency(balance?.available || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Dalam Proses</p>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {formatCurrency(balance?.pending || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sudah Ditarik</p>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(balance?.withdrawn || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Tarik Dana</CardTitle>
            <CardDescription>Transfer ke rekening bank Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasBankInfo ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg text-yellow-800">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Rekening belum dikonfigurasi</p>
                  <p className="text-sm mt-1">
                    Silakan lengkapi informasi rekening bank di halaman profil
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm text-muted-foreground">Rekening Tujuan</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{bankInfo.bankName}</p>
                      <p className="text-sm">{bankInfo.bankAccountNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        a.n. {bankInfo.bankAccountName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Penarikan</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="100000"
                    min={100000}
                    max={balance?.available || 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum Rp 100.000 • Tersedia:{' '}
                    {formatCurrency(balance?.available || 0)}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting ||
                    !withdrawAmount ||
                    Number(withdrawAmount) < 100000 ||
                    Number(withdrawAmount) > (balance?.available || 0)
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                  )}
                  Tarik Dana
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penarikan</CardTitle>
            <CardDescription>20 transaksi terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowDownToLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada riwayat penarikan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.bankName} • {withdrawal.bankAccountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(withdrawal.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusColors[withdrawal.status]}>
                      {statusLabels[withdrawal.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3 text-blue-800">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Informasi Penarikan</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Minimum penarikan Rp 100.000</li>
                <li>Proses transfer 1-3 hari kerja</li>
                <li>Platform memotong 10% dari setiap pembayaran proyek</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
