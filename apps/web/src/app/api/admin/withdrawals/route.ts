import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          analyst: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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

const updateWithdrawalSchema = z.object({
  withdrawalId: z.string(),
  action: z.enum(['approve', 'reject', 'complete']),
  failureReason: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWithdrawalSchema.parse(body);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: validatedData.withdrawalId },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (validatedData.action === 'approve') {
      if (withdrawal.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Withdrawal sudah diproses' },
          { status: 400 }
        );
      }

      await prisma.withdrawal.update({
        where: { id: validatedData.withdrawalId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Withdrawal disetujui dan sedang diproses',
      });
    }

    if (validatedData.action === 'complete') {
      if (withdrawal.status !== 'PROCESSING') {
        return NextResponse.json(
          { error: 'Withdrawal harus dalam status PROCESSING' },
          { status: 400 }
        );
      }

      await prisma.withdrawal.update({
        where: { id: validatedData.withdrawalId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Withdrawal selesai',
      });
    }

    if (validatedData.action === 'reject') {
      if (!['PENDING', 'PROCESSING'].includes(withdrawal.status)) {
        return NextResponse.json(
          { error: 'Withdrawal tidak dapat ditolak' },
          { status: 400 }
        );
      }

      await prisma.withdrawal.update({
        where: { id: validatedData.withdrawalId },
        data: {
          status: 'FAILED',
          failureReason: validatedData.failureReason || 'Ditolak oleh admin',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Withdrawal ditolak',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
