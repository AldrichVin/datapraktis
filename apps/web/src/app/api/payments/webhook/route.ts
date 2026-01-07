import { NextResponse } from 'next/server';
import { prisma } from '@datapraktis/db';
import { verifySignature, getTransactionStatus } from '@/lib/midtrans';

interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  fraud_status?: string;
}

export async function POST(request: Request) {
  try {
    const notification: MidtransNotification = await request.json();

    console.log('Midtrans webhook received:', {
      orderId: notification.order_id,
      status: notification.transaction_status,
      paymentType: notification.payment_type,
    });

    // Verify signature
    const isValid = verifySignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      notification.signature_key
    );

    if (!isValid) {
      console.error('Invalid signature for order:', notification.order_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { midtransOrderId: notification.order_id },
      include: {
        milestone: true,
        project: true,
      },
    });

    if (!transaction) {
      console.error('Transaction not found:', notification.order_id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Handle different statuses
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    if (transactionStatus === 'capture') {
      // For credit card, check fraud status
      if (fraudStatus === 'accept') {
        await handleSuccessfulPayment(transaction.id, notification.payment_type);
      } else if (fraudStatus === 'challenge') {
        // Mark as pending for manual review
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'PENDING' },
        });
      }
    } else if (transactionStatus === 'settlement') {
      // Payment completed (for non-credit card methods)
      await handleSuccessfulPayment(transaction.id, notification.payment_type);
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
    } else if (transactionStatus === 'pending') {
      // Waiting for payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PENDING',
          paymentMethod: notification.payment_type,
        },
      });
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
      // Refunded
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(
  transactionId: string,
  paymentMethod: string
) {
  await prisma.$transaction(async (tx) => {
    // Update transaction status
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'ESCROWED',
        paymentMethod,
        escrowedAt: new Date(),
      },
    });

    // Get the transaction with milestone
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { milestone: true },
    });

    // If milestone is pending, start it
    if (transaction?.milestone?.status === 'PENDING') {
      await tx.milestone.update({
        where: { id: transaction.milestone.id },
        data: { status: 'IN_PROGRESS' },
      });
    }
  });
}

// Also handle GET for Midtrans status check (used for manual verification)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    // Get status from Midtrans
    const status = await getTransactionStatus(orderId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
