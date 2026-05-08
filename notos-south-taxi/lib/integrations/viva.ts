/**
 * Viva Wallet — Smart Checkout (charge 15% deposit at booking).
 * Docs: https://developer.vivawallet.com/apis-for-payments/payment-api/
 *
 * Two-step flow:
 *   1) Get OAuth token from VIVA_ACCOUNTS_URL/connect/token
 *   2) Create payment order at VIVA_BASE_URL/checkout/v2/orders
 *   3) Redirect user to {VIVA_BASE_URL}/web/checkout?ref={orderCode}
 *   4) Receive webhook at /api/webhook on success/failure
 */

const ACCOUNTS_URL  = (process.env.VIVA_ACCOUNTS_URL  || 'https://demo-accounts.vivapayments.com').replace(/\/$/, '');
// API calls (create order, check status) use api.vivapayments.com for live
// or demo.vivapayments.com for demo
const API_URL       = (process.env.VIVA_API_URL || (
  process.env.VIVA_BASE_URL?.includes('demo')
    ? 'https://demo.vivapayments.com'
    : 'https://api.vivapayments.com'
)).replace(/\/$/, '');
// Checkout page (where customer pays) is always www.vivapayments.com for live
const CHECKOUT_URL  = process.env.VIVA_BASE_URL?.includes('demo')
  ? 'https://demo.vivapayments.com'
  : 'https://www.vivapayments.com';
const CLIENT_ID     = process.env.VIVA_CLIENT_ID      || '';
const CLIENT_SECRET = process.env.VIVA_CLIENT_SECRET  || '';
const SOURCE_CODE   = process.env.VIVA_SOURCE_CODE    || '';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  console.log('[viva] fetching token from:', `${ACCOUNTS_URL}/connect/token`);

  const res = await fetch(`${ACCOUNTS_URL}/connect/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const rawToken = await res.text();
  console.log('[viva] token status:', res.status);
  console.log('[viva] token body:', rawToken);

  if (!res.ok) {
    throw new Error(`Viva token failed: ${res.status} ${rawToken}`);
  }

  const data = JSON.parse(rawToken) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export interface CreateOrderInput {
  /** Amount in EUR cents (Viva expects integer cents) */
  amountCents: number;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  /** Internal merchant reference, e.g. our booking ID */
  merchantTrns: string;
  /** What the customer sees on their statement */
  customerTrns: string;
  /** Language for the checkout page */
  preferredLocale?: 'en-US' | 'el-GR';
}

export interface CreateOrderResult {
  orderCode: number;
  checkoutUrl: string;
}

export async function createPaymentOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  console.log('[viva] CLIENT_ID set:', !!CLIENT_ID);
  console.log('[viva] CLIENT_SECRET set:', !!CLIENT_SECRET);
  console.log('[viva] SOURCE_CODE set:', !!SOURCE_CODE);
  console.log('[viva] ACCOUNTS_URL:', ACCOUNTS_URL);
  console.log('[viva] API_URL:', API_URL);

  if (!CLIENT_ID || !CLIENT_SECRET || !SOURCE_CODE) {
    throw new Error('Viva Wallet env vars not configured (VIVA_CLIENT_ID, VIVA_CLIENT_SECRET, VIVA_SOURCE_CODE)');
  }

  const token = await getAccessToken();

  const orderPayload = {
    amount:              input.amountCents,
    customerTrns:        input.customerTrns,
    merchantTrns:        input.merchantTrns,
    sourceCode:          SOURCE_CODE,
    customer: {
      email:             input.customerEmail,
      fullName:          input.customerFullName,
      phone:             input.customerPhone,
      countryCode:       'GR',
      requestLang:       input.preferredLocale || 'en-US',
    },
    paymentTimeOut:      1800,
    preauth:             false,
    allowRecurring:      false,
    maxInstallments:     0,
    paymentNotification: true,
    tipAmount:           0,
    disableExactAmount:  false,
    disableCash:         true,
    disableWallet:       false,
  };

  console.log('[viva] creating order at:', `${API_URL}/checkout/v2/orders`);
  console.log('[viva] order payload:', JSON.stringify(orderPayload));

  const res = await fetch(`${API_URL}/checkout/v2/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  const rawOrder = await res.text();
  console.log('[viva] order status:', res.status);
  console.log('[viva] order body:', rawOrder);

  if (!res.ok) {
    throw new Error(`Viva order failed: ${res.status} ${rawOrder}`);
  }

  const data = JSON.parse(rawOrder) as { orderCode: number };

  // Derive checkout domain from the same env-configured API URL so demo and
  // production both point to the correct Viva checkout page.
  return {
    orderCode:   data.orderCode,
    checkoutUrl: `${CHECKOUT_URL}/web/checkout?ref=${data.orderCode}`,
  };
}  

export function verifyWebhook(_payload: unknown): boolean {
  return true;
}

/**
 * Look up the payment state of an orderCode directly with Viva.
 * Used as a fallback when the webhook hasn't fired yet OR when our DB
 * lost the booking (in-memory adapter loses state across Lambda invocations).
 *
 * Returns 'paid' if any successful transaction exists for the order,
 * 'pending' if the order exists but has no successful transaction yet,
 * 'failed' if it was attempted and failed, 'unknown' on errors.
 */
export async function checkOrderStatus(orderCode: number | string): Promise<'paid' | 'pending' | 'failed' | 'unknown'> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('[viva] missing credentials');
    return 'unknown';
  }

  try {
    const token = await getAccessToken();

    // The orderCode from the success URL (?s=...) is a 16-digit number.
    // We use the transactions endpoint filtered by orderCode.
    // Correct live URL: https://api.vivapayments.com/checkout/v2/transactions/{transactionId}
    // BUT we don't have the transactionId here, only orderCode.
    // Use the order retrieval endpoint instead:
    // GET https://api.vivapayments.com/checkout/v2/orders/{orderCode}
    // This requires the redirect-checkout OAuth scope.

    const url = `${API_URL}/checkout/v2/orders/${orderCode}`;
    console.log('[viva] checking order at:', url);

    const orderRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const rawBody = await orderRes.text();
    console.log('[viva] order lookup status:', orderRes.status, 'body:', rawBody.slice(0, 200));

    if (!orderRes.ok) {
      console.warn('[viva] order lookup failed:', orderRes.status);
      return 'unknown';
    }

    const order = JSON.parse(rawBody);
    console.log('[viva] order stateId:', order.stateId, 'paymentAmount:', order.paymentAmount);

    // stateId 3 = paid, 1 = expired, 2 = cancelled
    if (order.stateId === 3 || order.stateId === '3') return 'paid';
    if (order.stateId === 2 || order.stateId === 1) return 'failed';
    if (typeof order.paymentAmount === 'number' && order.paymentAmount > 0) return 'paid';

    return 'pending';
  } catch (err) {
    console.warn('[viva] order status check threw:', err);
    return 'unknown';
  }
}

/**
 * Check payment status using the transaction ID (the `t=` UUID in the success URL).
 * This is more reliable than the order lookup for confirming payment.
 * statusId "F" = Finished (paid), "E" = Error, "A" = Authorized, "X" = Refunded
 */
export async function checkTransactionStatus(transactionId: string): Promise<'paid' | 'pending' | 'failed' | 'unknown'> {
  if (!CLIENT_ID || !CLIENT_SECRET || !transactionId) return 'unknown';

  try {
    const token = await getAccessToken();
    const url = `${API_URL}/checkout/v2/transactions/${transactionId}`;
    console.log('[viva] checking transaction at:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const rawBody = await res.text();
    console.log('[viva] transaction status:', res.status, 'body:', rawBody.slice(0, 300));

    if (!res.ok) {
      console.warn('[viva] transaction lookup failed:', res.status);
      return 'unknown';
    }

    const tx = JSON.parse(rawBody);
    const statusId = tx.statusId ?? tx.StatusId;
    console.log('[viva] transaction statusId:', statusId);

    if (statusId === 'F') return 'paid';
    if (statusId === 'E' || statusId === 'X') return 'failed';
    if (statusId === 'A') return 'pending'; // authorized but not captured

    return 'pending';
  } catch (err) {
    console.warn('[viva] transaction check threw:', err);
    return 'unknown';
  }
}
