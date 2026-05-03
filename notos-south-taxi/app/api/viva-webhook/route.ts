import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyWebhook } from '@/lib/integrations/viva';
import { notifyDriverNewBooking } from '@/lib/integrations/sendzen';

/**
 * Viva sends a GET first (verification handshake) and then POSTs events.
 * Handshake: returns the Key configured in dashboard.
 * Events: Transaction Payment Created (1796) is the success event we care about.
 */

export async function GET() {
  const key = process.env.VIVA_WEBHOOK_VERIFICATION_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 500 });
  return NextResponse.json({ Key: key });
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload || !verifyWebhook(payload)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Viva event payload shape:
  // { EventTypeId: 1796, EventData: { OrderCode, MerchantTrns, ... }, Created, Url, Key }
  const eventTypeId = payload.EventTypeId;
  const orderCode = payload?.EventData?.OrderCode;
  if (!orderCode) return NextResponse.json({ ok: true });

  const booking = await db.getByVivaOrder(Number(orderCode));
  if (!booking) {
    console.warn('[viva-webhook] no booking for orderCode', orderCode);
    return NextResponse.json({ ok: true });
  }

  if (eventTypeId === 1796) {
    // Payment success
    await db.setStatus(booking.id, 'paid', { notifiedAt: new Date().toISOString() });
    const driver = process.env.DRIVER_WHATSAPP_NUMBER;
    if (driver) {
      await notifyDriverNewBooking(driver, {
        bookingRef: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        fromText: booking.fromText,
        toText: booking.toText,
        pickupAtIso: booking.pickupAtIso,
        passengers: booking.passengers,
        luggage: booking.luggage,
        childSeats: booking.childSeats,
        vehicle: booking.vehicle,
        flightNumber: booking.flightNumber,
        notes: booking.notes,
        totalEUR: booking.totalEUR,
        depositEUR: booking.depositEUR,
        remainderEUR: booking.remainderEUR
      });
    }
  } else if (eventTypeId === 1798) {
    // Transaction failed
    await db.setStatus(booking.id, 'cancelled');
  }

  return NextResponse.json({ ok: true });
}
