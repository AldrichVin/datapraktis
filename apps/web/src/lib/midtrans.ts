// Midtrans Server Integration
// Documentation: https://docs.midtrans.com/docs

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const BASE_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

const CORE_API_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

interface CreateTransactionParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  description: string;
}

interface TransactionResult {
  token: string;
  redirect_url: string;
}

interface TransactionStatus {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  fraud_status?: string;
}

// Create Snap payment token
export async function createTransaction(
  params: CreateTransactionParams
): Promise<TransactionResult> {
  const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
      },
      item_details: [
        {
          id: params.orderId,
          price: params.amount,
          quantity: 1,
          name: params.description.substring(0, 50), // Max 50 chars
        },
      ],
      // Enable all payment methods
      enabled_payments: [
        'credit_card',
        'gopay',
        'shopeepay',
        'bank_transfer',
        'bca_va',
        'bni_va',
        'bri_va',
        'permata_va',
        'other_va',
        'echannel', // Mandiri Bill
        'cstore', // Alfamart, Indomaret
        'akulaku',
        'kredivo',
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Midtrans error:', error);
    throw new Error(error.error_messages?.[0] || 'Failed to create transaction');
  }

  return response.json();
}

// Get transaction status
export async function getTransactionStatus(
  orderId: string
): Promise<TransactionStatus> {
  const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');

  const response = await fetch(`${CORE_API_URL}/${orderId}/status`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authString}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.status_message || 'Failed to get transaction status');
  }

  return response.json();
}

// Verify webhook notification signature
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  return hash === signatureKey;
}

// Calculate platform fee (10%)
export function calculateFees(amount: number) {
  const platformFee = Math.round(amount * 0.1);
  const netAmount = amount - platformFee;
  return { platformFee, netAmount };
}

// Format for display
export function formatMidtransAmount(amount: number): number {
  // Midtrans requires integer amounts in IDR
  return Math.round(amount);
}

export { MIDTRANS_CLIENT_KEY };
