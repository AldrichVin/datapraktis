import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createWithdrawalSchema = z.object({
  amount: z.number().min(100000, 'Minimum withdrawal Rp 100.000'),
});

// Get withdrawal history and available balance
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ANALYST') {
      return NextResponse.json({ error: 'Analysts only' }, { status: 403 });
    }

    // Get analyst profile with bank info
    const analystProfile = await prisma.analystProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Calculate available balance (released payments - completed withdrawals)
    const releasedPayments = await prisma.transaction.aggregate({
      where: {
        project: {
          hiredAnalystId: session.user.id,
        },
        status: 'RELEASED',
      },
      _sum: {
        netAmount: true,
      },
    });

    const completedWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        analystId: session.user.id,
        status: 'COMPLETED',
      },
      _sum: {
        netAmount: true,
      },
    });

    const pendingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        analystId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: {
        netAmount: true,
      },
    });

    const totalEarnings = releasedPayments._sum.netAmount || 0;
    const withdrawn = completedWithdrawals._sum.netAmount || 0;
    const pending = pendingWithdrawals._sum.netAmount || 0;
    const availableBalance = totalEarnings - withdrawn - pending;

    // Get withdrawal history
    const withdrawals = await prisma.withdrawal.findMany({
      where: { analystId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          total: totalEarnings,
          withdrawn,
          pending,
          available: availableBalance,
        },
        bankInfo: {
          bankName: analystProfile?.bankName,
          bankAccountNumber: analystProfile?.bankAccountNumber,
          bankAccountName: analystProfile?.bankAccountName,
        },
        withdrawals,
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// Request withdrawal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ANALYST') {
      return NextResponse.json({ error: 'Analysts only' }, { status: 403 });
    }

    // Get analyst profile
    const analystProfile = await prisma.analystProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !analystProfile?.bankName ||
      !analystProfile?.bankAccountNumber ||
      !analystProfile?.bankAccountName
    ) {
      return NextResponse.json(
        { error: 'Lengkapi informasi rekening bank terlebih dahulu' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount } = createWithdrawalSchema.parse(body);

    // Calculate available balance
    const releasedPayments = await prisma.transaction.aggregate({
      where: {
        project: {
          hiredAnalystId: session.user.id,
        },
        status: 'RELEASED',
      },
      _sum: {
        netAmount: true,
      },
    });

    const completedWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        analystId: session.user.id,
        status: 'COMPLETED',
      },
      _sum: {
        netAmount: true,
      },
    });

    const pendingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        analystId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      _sum: {
        netAmount: true,
      },
    });

    const totalEarnings = releasedPayments._sum.netAmount || 0;
    const withdrawn = completedWithdrawals._sum.netAmount || 0;
    const pending = pendingWithdrawals._sum.netAmount || 0;
    const availableBalance = totalEarnings - withdrawn - pending;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi' },
        { status: 400 }
      );
    }

    // Create withdrawal request (fee is 0 for now, can be added later)
    const withdrawal = await prisma.withdrawal.create({
      data: {
        analystId: session.user.id,
        amount,
        fee: 0,
        netAmount: amount,
        bankName: analystProfile.bankName,
        bankAccountNumber: analystProfile.bankAccountNumber,
        bankAccountName: analystProfile.bankAccountName,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permintaan penarikan berhasil dibuat',
      data: withdrawal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}
