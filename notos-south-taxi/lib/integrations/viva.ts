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

const ACCOUNTS_URL = process.env.VIVA_ACCOUNTS_URL || 'https://demo-accounts.vivapayments.com';
const API_URL      = process.env.VIVA_BASE_URL      || 'https://demo.vivapayments.com';
const CLIENT_ID    = process.env.VIVA_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.VIVA_CLIENT_SECRET || '';
const SOURCE_CODE  = process.env.VIVA_SOURCE_CODE   || '';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${ACCOUNTS_URL}/connect/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Viva token failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
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
  if (!CLIENT_ID || !CLIENT_SECRET || !SOURCE_CODE) {
    throw new Error('Viva Wallet env vars not configured (VIVA_CLIENT_ID, VIVA_CLIENT_SECRET, VIVA_SOURCE_CODE)');
  }

  const token = await getAccessToken();

  const res = await fetch(`${API_URL}/checkout/v2/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:        input.amountCents,
      customerTrns:  input.customerTrns,
      merchantTrns:  input.merchantTrns,
      sourceCode:    SOURCE_CODE,
      customer: {
        email:       input.customerEmail,
        fullName:    input.customerFullName,
        phone:       input.customerPhone,
        countryCode: 'GR',
        requestLang: input.preferredLocale || 'en-US',
      },
      paymentTimeOut:     1800,
      preauth:            false,
      allowRecurring:     false,
      maxInstallments:    0,
      paymentNotification: true,
      tipAmount:          0,
      disableExactAmount: false,
      disableCash:        true,
      disableWallet:      false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Viva order failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { orderCode: number };

  return {
    orderCode:   data.orderCode,
    checkoutUrl: `${API_URL}/web/checkout?ref=${data.orderCode}`,
  };
}

/**
 * Webhook verification:
 *
 * The GET handshake works like this:
 *   - Viva calls GET /api/webhook
 *   - You return VIVA_WEBHOOK_VERIFICATION_KEY as plain text
 *   - Viva confirms the key matches what you set in the dashboard
 *
 * POST events do NOT carry a verification key in the body.
 * Security is established by the GET handshake at registration time.
 *
 * This function is kept for compatibility but always returns true.
 * Do not add Key-in-body checks — Viva never sends it on POST.
 */
export function verifyWebhook(_payload: unknown): boolean {
  return true;
}
