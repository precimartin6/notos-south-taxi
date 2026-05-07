import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkOrderStatus } from '@/lib/integrations/viva';
import { sendCustomerConfirmation, sendDriverNotification, type CustomerEmailPayload } from '@/lib/integrations/email';
import { notifyDriverNewBooking } from '@/lib/integrations/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Helper: send customer email + driver email + driver WhatsApp.
 * Fire-and-forget — don't block the response if any notification fails.
 */
async function sendNotifications(row: any) {
  if (!row) return;
  const payload: CustomerEmailPayload = {
    bookingRef: row.id,
    customerName: row.customerName ?? 'Customer',
    customerEmail: row.customerEmail ?? '',
    customerPhone: row.customerPhone ?? '',
    fromText: row.fromText ?? '',
    toText: row.toText ?? '',
    pickupAtIso: row.pickupAtIso ?? '',
    passengers: row.passengers ?? 1,
    luggage: row.luggage ?? 0,
    childSeats: row.childSeats ?? 0,
    vehicle: row.vehicle ?? 'taxi',
    flightNumber: row.flightNumber,
    notes: row.notes,
    totalEUR: row.totalEUR ?? 0,
    depositEUR: row.depositEUR ?? 0,
    remainderEUR: row.remainderEUR ?? 0,
    locale: row.locale ?? 'en',
  };

  // 1. Customer confirmation email
  if (payload.customerEmail) {
    console.log('[status] Sending customer confirmation to', payload.customerEmail);
    await sendCustomerConfirmation(payload).catch(e =>
      console.error('[status] customer email failed:', e)
    );
  }

  // 2. Driver email
  console.log('[status] Sending driver email notification');
  await sendDriverNotification(payload).catch(e =>
    console.error('[status] driver email failed:', e)
  );

  // 3. Driver WhatsApp via CallMeBot
  console.log('[status] Sending driver WhatsApp via CallMeBot');
  await notifyDriverNewBooking('', {
    bookingRef: payload.bookingRef,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    fromText: payload.fromText,
    toText: payload.toText,
    pickupAtIso: payload.pickupAtIso,
    passengers: payload.passengers,
    luggage: payload.luggage,
    childSeats: payload.childSeats,
    vehicle: payload.vehicle,
    flightNumber: payload.flightNumber,
    notes: payload.notes,
    totalEUR: payload.totalEUR,
    depositEUR: payload.depositEUR,
    remainderEUR: payload.remainderEUR,
  }).catch(e =>
    console.error('[status] WhatsApp notification failed:', e)
  );
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const orderCode = req.nextUrl.searchParams.get('orderCode');

  if (!id && !orderCode) {
    return NextResponse.json({ error: 'missing_id_or_orderCode' }, { status: 400 });
  }

  // 1. Try our DB first
  let row = id ? await db.getById(id) : null;

  // 2. Already paid in DB? Return immediately.
  //    (Emails were already sent when the status first flipped to paid.)
  if (row && row.status === 'paid') {
    return NextResponse.json({
      id: row.id,
      status: row.status,
      totalEUR: row.totalEUR,
      depositEUR: row.depositEUR,
      remainderEUR: row.remainderEUR,
      source: 'db'
    });
  }

  // 3. Ask Viva directly (handles webhook latency + in-memory DB loss)
  const codeForViva = row?.vivaOrderCode ?? (orderCode ? Number(orderCode) : null);

  if (codeForViva) {
    const vivaStatus = await checkOrderStatus(codeForViva);
    console.log('[status] Viva direct check for orderCode', codeForViva, '→', vivaStatus);

    if (vivaStatus === 'paid') {
      // Update DB if we have the row
      if (row) {
        await db.setStatus(row.id, 'paid', { notifiedAt: new Date().toISOString() });
      }

      // Send emails NOW — this is the moment we know payment succeeded.
      // The webhook might also fire and send emails, but that's OK — 
      // a duplicate "booking confirmed" email is better than zero emails.
      if (row) {
        await sendNotifications(row);
      }

      return NextResponse.json({
        id: row?.id ?? null,
        status: 'paid',
        totalEUR: row?.totalEUR ?? null,
        depositEUR: row?.depositEUR ?? null,
        remainderEUR: row?.remainderEUR ?? null,
        source: 'viva-direct'
      });
    }

    if (vivaStatus === 'failed') {
      return NextResponse.json({
        id: row?.id ?? null,
        status: 'cancelled',
        source: 'viva-direct'
      });
    }
  }

  // 4. Still pending
  return NextResponse.json({
    id: row?.id ?? null,
    status: row?.status ?? 'pending',
    totalEUR: row?.totalEUR ?? null,
    depositEUR: row?.depositEUR ?? null,
    remainderEUR: row?.remainderEUR ?? null,
    source: 'pending'
  });
}
