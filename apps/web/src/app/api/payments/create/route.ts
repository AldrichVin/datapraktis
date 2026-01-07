import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@datapraktis/db';
import { authOptions } from '@/lib/auth';
import { createTransaction, calculateFees, formatMidtransAmount } from '@/lib/midtrans';
import { z } from 'zod';

const createPaymentSchema = z.object({
  milestoneId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneId } = createPaymentSchema.parse(body);

    // Get milestone with project info
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        transaction: true,
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Only client can create payment
    if (milestone.project.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if payment already exists and is completed
    if (milestone.transaction?.status === 'ESCROWED') {
      return NextResponse.json(
        { error: 'Pembayaran sudah dilakukan' },
        { status: 400 }
      );
    }

    const { platformFee, netAmount } = calculateFees(milestone.amount);

    // Generate unique order ID
    const orderId = `DP-${milestone.project.id.slice(-8)}-${milestone.id.slice(-8)}-${Date.now()}`;

    // Create or update transaction record
    let transaction;
    if (milestone.transaction) {
      transaction = await prisma.transaction.update({
        where: { id: milestone.transaction.id },
        data: {
          midtransOrderId: orderId,
          status: 'PENDING',
        },
      });
    } else {
      transaction = await prisma.transaction.create({
        data: {
          projectId: milestone.project.id,
          milestoneId: milestone.id,
          amount: milestone.amount,
          platformFee,
          netAmount,
          midtransOrderId: orderId,
          status: 'PENDING',
        },
      });
    }

    // Create Midtrans transaction
    const midtransResult = await createTransaction({
      orderId,
      amount: formatMidtransAmount(milestone.amount),
      customerName: milestone.project.client.name || 'Customer',
      customerEmail: milestone.project.client.email,
      description: `${milestone.project.title} - ${milestone.title}`,
    });

    // Update transaction with token
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { midtransToken: midtransResult.token },
    });

    return NextResponse.json({
      success: true,
      data: {
        token: midtransResult.token,
        redirectUrl: midtransResult.redirect_url,
        orderId,
        amount: milestone.amount,
        platformFee,
        netAmount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
