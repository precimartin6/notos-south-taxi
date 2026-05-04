import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyDriverNewBooking } from '@/lib/integrations/whatsapp';

/**
 * Viva Wallet Webhook Handler
 *
 * GET  — Verification handshake. Viva calls this when you register the webhook.
 *         Must return the VIVA_WEBHOOK_VERIFICATION_KEY as plain text.
 *
 * POST — Receives payment events after handshake is complete.
 *         EventTypeId 1796 = Transaction Payment Created (success)
 *         EventTypeId 1798 = Transaction Failed / Cancelled
 */

export async function GET() {
  const key = process.env.VIVA_WEBHOOK_VERIFICATION_KEY;

  if (!key) {
    console.error('[viva-webhook] VIVA_WEBHOOK_VERIFICATION_KEY is not set');
    return NextResponse.json({ error: 'no_key' }, { status: 500 });
  }

  // Viva expects the key back as plain text — NOT JSON
  return new Response(key, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function POST(req: NextRequest) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    console.error('[viva-webhook] Failed to parse JSON body');
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }

  // Viva does NOT send the verification key in POST requests.
  // Security is established via the GET handshake at webhook registration.
  // Log the raw event for debugging.
  console.log('[viva-webhook] Received event:', JSON.stringify(payload));

  const eventTypeId = payload?.EventTypeId;
  const orderCode = payload?.EventData?.OrderCode;

  if (!orderCode) {
    // Some event types don't carry an OrderCode — acknowledge and ignore.
    console.log('[viva-webhook] No OrderCode in payload, ignoring event', eventTypeId);
    return NextResponse.json({ ok: true });
  }

  const booking = await db.getByVivaOrder(Number(orderCode));

  if (!booking) {
    console.warn('[viva-webhook] No booking found for orderCode', orderCode);
    // Return 200 so Viva doesn't keep retrying for an unknown order
    return NextResponse.json({ ok: true });
  }

  if (eventTypeId === 1796) {
    // ✅ Payment success — Transaction Payment Created
    console.log('[viva-webhook] Payment success for booking', booking.id);

    await db.setStatus(booking.id, 'paid', {
      notifiedAt: new Date().toISOString(),
    });

    await notifyDriverNewBooking('', {
      bookingRef:    booking.id,
      customerName:  booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      fromText:      booking.fromText,
      toText:        booking.toText,
      pickupAtIso:   booking.pickupAtIso,
      passengers:    booking.passengers,
      luggage:       booking.luggage,
      childSeats:    booking.childSeats,
      vehicle:       booking.vehicle,
      flightNumber:  booking.flightNumber,
      notes:         booking.notes,
      totalEUR:      booking.totalEUR,
      depositEUR:    booking.depositEUR,
      remainderEUR:  booking.remainderEUR,
    });

  } else if (eventTypeId === 1798) {
    // ❌ Transaction failed / cancelled
    console.log('[viva-webhook] Payment failed for booking', booking.id);
    await db.setStatus(booking.id, 'cancelled');

  } else {
    console.log('[viva-webhook] Unhandled eventTypeId', eventTypeId);
  }

  return NextResponse.json({ ok: true });
}
