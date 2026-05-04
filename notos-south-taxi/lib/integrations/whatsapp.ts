/**
 * CallMeBot WhatsApp notifier
 *
 * SETUP (one-time, 2 minutes):
 * 1. Save +34 644 64 21 21 in the driver's contacts
 * 2. Send "I allow callmebot to send me messages" to that number on WhatsApp
 * 3. You'll receive an API key in reply
 * 4. Set in Vercel env vars:
 *      CALLMEBOT_PHONE   = +306946564581
 *      CALLMEBOT_API_KEY = (key from step 3)
 */

const BASE_URL = 'https://api.callmebot.com/whatsapp.php';

export interface BookingPayload {
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
  const date = dt.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Athens'
  });

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
    `*Booking fee paid:* €${b.depositEUR.toFixed(2)}`,
    `*Cash on arrival:* €${b.remainderEUR.toFixed(2)}`
  ]
    .filter(Boolean)
    .join('\n');
}

export async function notifyDriverNewBooking(
  _driverPhone: string,
  b: BookingPayload
): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apiKey) {
    console.warn('[callmebot] CALLMEBOT_PHONE or CALLMEBOT_API_KEY not set — skipping notification');
    return;
  }

  const message = formatBookingMessage(b);
  const url = `${BASE_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[callmebot] Failed (${res.status}):`, text);
    } else {
      console.log(`[callmebot] Driver notified for booking ${b.bookingRef} ✓`);
    }
  } catch (err) {
    console.error('[callmebot] Request error:', err);
  }
}
