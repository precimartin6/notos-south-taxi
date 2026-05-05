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

const ACCOUNTS_URL  = process.env.VIVA_ACCOUNTS_URL  || 'https://demo-accounts.vivapayments.com';
const API_URL       = process.env.VIVA_BASE_URL       || 'https://demo.vivapayments.com';
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

  return {
  orderCode:   data.orderCode,
  checkoutUrl: `https://www.vivapayments.com/web/checkout?ref=${data.orderCode}`,
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
  if (!CLIENT_ID || !CLIENT_SECRET) return 'unknown';

  try {
    const token = await getAccessToken();
    const res = await fetch(`${API_URL}/checkout/v2/transactions?orderCode=${orderCode}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[viva] order status check failed:', res.status);
      return 'unknown';
    }

    const data = await res.json();
    // The transactions endpoint returns either an array or { transactions: [...] }
    const txns = Array.isArray(data) ? data : (data?.transactions || data?.Transactions || []);

    if (!txns.length) return 'pending';

    // statusId === 'F' (Finished) means success in Viva's vocabulary.
    // 'E' = Error, 'A' = Authorized but not captured, 'X' = Refunded.
    const anyPaid = txns.some((t: any) =>
      t?.statusId === 'F' || t?.StatusId === 'F' || t?.status === 'F'
    );
    if (anyPaid) return 'paid';

    const anyFailed = txns.some((t: any) =>
      t?.statusId === 'E' || t?.StatusId === 'E' || t?.status === 'E'
    );
    if (anyFailed) return 'failed';

    return 'pending';
  } catch (err) {
    console.warn('[viva] order status check threw:', err);
    return 'unknown';
  }
}
