/**
 * SendZen WhatsApp API — sends a message to the driver (and optionally
 * the customer) when a booking is paid.
 *
 * Docs: https://www.sendzen.io/docs
 * Base URL: https://api.sendzen.io
 * Auth: Authorization: Bearer <YOUR_API_KEY>
 *
 * IMPORTANT: WhatsApp Business API requires a pre-approved TEMPLATE to
 * initiate conversation outside the 24h customer-care window. For sending
 * to your own driver who has previously messaged the WABA number, a
 * session message works. For first-contact to the customer you MUST use
 * a template.
 */

const API_KEY = process.env.SENDZEN_API_KEY || '';
const FROM_PHONE_ID = process.env.SENDZEN_FROM_PHONE_ID || '';
const TEMPLATE_NAME = process.env.SENDZEN_TEMPLATE_NAME || '';
const TEMPLATE_LANG = process.env.SENDZEN_TEMPLATE_LANG || 'en';
const BASE_URL = 'https://api.sendzen.io';

interface BookingPayload {
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fromText: string;
  toText: string;
  pickupAtIso: string;
  passengers: number;
  luggage: number;
  childSeats: number;
  vehicle: string;
  flightNumber?: string;
  notes?: string;
  totalEUR: number;
  depositEUR: number;
  remainderEUR: number;
}

function formatBookingMessage(b: BookingPayload): string {
  const dt = new Date(b.pickupAtIso);
  const date = dt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Athens' });
  return [
    `🚖 *NEW BOOKING* — ${b.bookingRef}`,
    ``,
    `*Pickup:* ${date}`,
    `*From:* ${b.fromText}`,
    `*To:* ${b.toText}`,
    ``,
    `*Customer:* ${b.customerName}`,
    `*Phone:* ${b.customerPhone}`,
    `*Email:* ${b.customerEmail}`,
    b.flightNumber ? `*Flight:* ${b.flightNumber}` : '',
    ``,
    `*Vehicle:* ${b.vehicle}`,
    `*Passengers:* ${b.passengers} | *Luggage:* ${b.luggage} | *Child seats:* ${b.childSeats}`,
    b.notes ? `*Notes:* ${b.notes}` : '',
    ``,
    `*Total:* €${b.totalEUR.toFixed(2)}`,
    `*Deposit paid (15%):* €${b.depositEUR.toFixed(2)}`,
    `*Cash on arrival (85%):* €${b.remainderEUR.toFixed(2)}`
  ]
    .filter(Boolean)
    .join('\n');
}

function normalize(num: string) {
  // Remove leading + and any spaces
  return num.replace(/^\+/, '').replace(/\D/g, '');
}

/**
 * Send a session text message (works if the recipient messaged the WABA
 * number in the last 24h, or for your own driver whose number is pre-cleared).
 */
async function sendSessionText(toPhone: string, body: string) {
  const res = await fetch(`${BASE_URL}/v1/messages/session/text`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_PHONE_ID,
      to: normalize(toPhone),
      type: 'text',
      text: { body }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`SendZen session text failed (${res.status}): ${t}`);
  }
  return res.json();
}

/**
 * Send a template message (for first-contact, e.g. customer confirmation).
 * The template must be pre-approved in your SendZen / Meta dashboard.
 * Variables are passed positionally into the template body.
 */
async function sendTemplate(toPhone: string, variables: string[]) {
  if (!TEMPLATE_NAME) throw new Error('SENDZEN_TEMPLATE_NAME not set');
  const res = await fetch(`${BASE_URL}/v1/messages/template`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_PHONE_ID,
      to: normalize(toPhone),
      type: 'template',
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANG },
        components: [
          {
            type: 'body',
            parameters: variables.map((v) => ({ type: 'text', text: v }))
          }
        ]
      }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`SendZen template failed (${res.status}): ${t}`);
  }
  return res.json();
}

/**
 * Notify the driver about a new paid booking. Best-effort — failure is
 * logged but does not break the booking flow (the booking is already in DB).
 */
export async function notifyDriverNewBooking(driverPhone: string, b: BookingPayload) {
  if (!API_KEY || !FROM_PHONE_ID) {
    console.warn('[sendzen] env not configured, skipping');
    return;
  }
  const text = formatBookingMessage(b);
  try {
    await sendSessionText(driverPhone, text);
  } catch (e) {
    console.error('[sendzen] driver notify failed:', e);
    // Optional fallback: send via template if you have one set up
    try {
      if (TEMPLATE_NAME) {
        await sendTemplate(driverPhone, [
          b.bookingRef,
          b.customerName,
          new Date(b.pickupAtIso).toLocaleString('en-GB'),
          `${b.fromText} → ${b.toText}`,
          `€${b.totalEUR.toFixed(2)}`
        ]);
      }
    } catch (e2) {
      console.error('[sendzen] template fallback failed:', e2);
    }
  }
}
