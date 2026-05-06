import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifyDriverNewBooking } from '@/lib/integrations/whatsapp';
import { sendCustomerConfirmation, sendDriverNotification } from '@/lib/integrations/email';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('Key');
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 400 });
  return NextResponse.json({ Key: key });
}

export async function POST(req: NextRequest) {
  let payload: any;

  try {
    payload = await req.json();
  } catch {
    console.error('[viva-webhook] Failed to parse JSON body');
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }

  console.log('[viva-webhook] Received event:', JSON.stringify(payload));

  const eventTypeId = payload?.EventTypeId;
  const orderCode = payload?.EventData?.OrderCode;

  if (!orderCode) {
    console.log('[viva-webhook] No OrderCode in payload, ignoring event', eventTypeId);
    return NextResponse.json({ ok: true });
  }

  const booking = await db.getByVivaOrder(Number(orderCode));

  if (!booking) {
    console.warn('[viva-webhook] No booking found for orderCode', orderCode, '— KV not configured? See README for Vercel KV setup.');
    return NextResponse.json({ ok: true });
  }

  if (eventTypeId === 1796) {
    console.log('[viva-webhook] Payment success for booking', booking.id);
    await db.setStatus(booking.id, 'paid', {
      notifiedAt: new Date().toISOString(),
    });

    // Notify driver via WhatsApp (CallMeBot)
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

    // Send driver notification email to Martin Preci
    await sendDriverNotification({
      bookingRef:    booking.id,
      customerName:  booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
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

    // Send booking confirmation email to customer
    await sendCustomerConfirmation({
      bookingRef:    booking.id,
      customerName:  booking.customerName,
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
      locale:        booking.locale,
    });
  } else if (eventTypeId === 1798) {
    console.log('[viva-webhook] Payment failed for booking', booking.id);
    await db.setStatus(booking.id, 'cancelled');
  } else {
    console.log('[viva-webhook] Unhandled eventTypeId', eventTypeId);
  }

  return NextResponse.json({ ok: true });
}
