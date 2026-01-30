import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

type TransactionClient = Prisma.TransactionClient;

const releasePaymentSchema = z.object({
  milestoneId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneId } = releasePaymentSchema.parse(body);

    // Get milestone with transaction
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: true,
        transaction: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Only client can release payment
    if (milestone.project.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check milestone is approved
    if (milestone.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Milestone belum disetujui' },
        { status: 400 }
      );
    }

    // Check transaction exists and is in escrow
    if (!milestone.transaction || milestone.transaction.status !== 'ESCROWED') {
      return NextResponse.json(
        { error: 'Tidak ada pembayaran yang dapat dicairkan' },
        { status: 400 }
      );
    }

    // Release the payment with 5-day security hold
    const now = new Date();
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 5); // 5-day security hold

    await prisma.$transaction(async (tx: TransactionClient) => {
      // Update transaction with security hold
      await tx.transaction.update({
        where: { id: milestone.transaction!.id },
        data: {
          status: 'RELEASED',
          releasedAt: now,
          availableAt: availableAt, // Funds available after 5 days
        },
      });

      // Update analyst balance
      if (milestone.project.hiredAnalystId) {
        await tx.analystProfile.update({
          where: { userId: milestone.project.hiredAnalystId },
          data: {
            balance: { increment: milestone.transaction!.netAmount },
            totalEarnings: { increment: milestone.transaction!.netAmount },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Dana berhasil dicairkan! Tersedia untuk penarikan dalam 5 hari.',
      data: {
        netAmount: milestone.transaction.netAmount,
        availableAt: availableAt.toISOString(),
        securityHoldDays: 5,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error releasing payment:', error);
    return NextResponse.json(
      { error: 'Failed to release payment' },
      { status: 500 }
    );
  }
}
