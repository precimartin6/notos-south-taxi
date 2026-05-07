import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkOrderStatus } from '@/lib/integrations/viva';
import { sendCustomerConfirmation, sendDriverNotification, type CustomerEmailPayload } from '@/lib/integrations/email';

export const dynamic = 'force-dynamic';

/**
 * Helper: send both customer + driver emails. Fire-and-forget (don't
 * block the response if email fails — the customer still sees "paid").
 */
async function sendNotifications(row: any) {
  if (!row) return;
  const payload: CustomerEmailPayload = {
    bookingRef: row.id,
    customerName: row.customerName ?? 'Customer',
    customerEmail: row.customerEmail ?? '',
    customerPhone: row.customerPhone,
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

  // Only send if customer email is present
  if (payload.customerEmail) {
    console.log('[status] Sending customer confirmation to', payload.customerEmail);
    await sendCustomerConfirmation(payload).catch(e =>
      console.error('[status] customer email failed:', e)
    );
  }

  console.log('[status] Sending driver notification');
  await sendDriverNotification(payload).catch(e =>
    console.error('[status] driver email failed:', e)
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
