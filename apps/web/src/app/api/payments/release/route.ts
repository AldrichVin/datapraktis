import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

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

    // Release the payment
    await prisma.transaction.update({
      where: { id: milestone.transaction.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Dana berhasil dicairkan ke analyst',
      data: {
        netAmount: milestone.transaction.netAmount,
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
