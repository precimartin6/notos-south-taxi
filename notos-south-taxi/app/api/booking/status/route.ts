import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkOrderStatus, checkTransactionStatus } from '@/lib/integrations/viva';
import { sendCustomerConfirmation, sendDriverNotification, type CustomerEmailPayload } from '@/lib/integrations/email';
import { notifyDriverNewBooking } from '@/lib/integrations/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * Fire all three notifications. Each one is independent — if one fails
 * the others still try.
 */
async function sendAllNotifications(payload: CustomerEmailPayload) {
  const tasks: Promise<any>[] = [];

  if (payload.customerEmail) {
    console.log('[status] Sending customer email to', payload.customerEmail);
    tasks.push(
      sendCustomerConfirmation(payload).catch(e => console.error('[status] customer email failed:', e))
    );
  }

  console.log('[status] Sending driver email + WhatsApp in parallel');
  tasks.push(
    sendDriverNotification(payload).catch(e => console.error('[status] driver email failed:', e))
  );
  tasks.push(
    notifyDriverNewBooking('', {
      bookingRef: payload.bookingRef,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone ?? '',
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
    }).catch(e => console.error('[status] WhatsApp failed:', e))
  );

  await Promise.all(tasks);
  console.log('[status] All notifications sent');
}

/**
 * POST /api/booking/status
 *
 * The success page sends the booking data along with the orderCode.
 * This endpoint checks Viva for payment, and if paid, sends notifications
 * using the booking data the client provides.
 *
 * This avoids depending on the in-memory DB, which loses data across
 * Vercel serverless invocations.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { bookingId, orderCode, transactionId, booking } = body as {
    bookingId?: string;
    orderCode?: string | number;
    transactionId?: string;
    booking?: any;
  };

  console.log('[status POST] bookingId:', bookingId, 'orderCode:', orderCode, 'transactionId:', transactionId, 'hasBooking:', !!booking);

  if (!bookingId && !orderCode && !transactionId) {
    return NextResponse.json({ error: 'missing_id_or_orderCode' }, { status: 400 });
  }

  // Try DB — first by bookingId, then by Viva order code
  let row = bookingId ? await db.getById(bookingId) : null;
  if (!row && orderCode) {
    row = await db.getByVivaOrder(Number(orderCode));
    console.log('[status POST] db lookup by orderCode:', !!row);
  }
  console.log('[status POST] db row found:', !!row, row?.id ?? null);

  if (row && row.status === 'paid') {
    return NextResponse.json({ id: row.id, status: 'paid', totalEUR: row.totalEUR, depositEUR: row.depositEUR, remainderEUR: row.remainderEUR, source: 'db' });
  }

  // Check Viva — try transaction ID first (most reliable), fall back to order code
  let vivaStatus: 'paid' | 'pending' | 'failed' | 'unknown' = 'unknown';
  let merchantTrns: string | undefined;

  if (transactionId) {
    const txResult = await checkTransactionStatus(transactionId);
    vivaStatus = txResult.status;
    merchantTrns = txResult.merchantTrns;
    console.log('[status POST] transaction check result:', vivaStatus, 'merchantTrns:', merchantTrns);

    // merchantTrns is the booking ID we set when creating the order
    // Use it to find the booking in KV if we don't have it yet
    if (!row && merchantTrns && merchantTrns.startsWith('NST-')) {
      row = await db.getById(merchantTrns);
      console.log('[status POST] db lookup by merchantTrns:', !!row, merchantTrns);
    }
  }

  if (vivaStatus === 'unknown' || vivaStatus === 'pending') {
    const codeForViva = row?.vivaOrderCode ?? orderCode;
    if (codeForViva) {
      const orderStatus = await checkOrderStatus(codeForViva);
      console.log('[status POST] order check result:', orderStatus);
      if (orderStatus !== 'unknown') vivaStatus = orderStatus;
    }
  }

  console.log('[status POST] final status:', vivaStatus, 'row found:', !!row);

  if (vivaStatus === 'paid') {
    if (row) {
      // If already marked paid and notified, don't send duplicate notifications
      if (row.status === 'paid' && row.notifiedAt) {
        console.log('[status POST] already notified, skipping');
        return NextResponse.json({ id: row.id, status: 'paid', totalEUR: row.totalEUR, depositEUR: row.depositEUR, remainderEUR: row.remainderEUR, source: 'db-cached' });
      }
      await db.setStatus(row.id, 'paid', { notifiedAt: new Date().toISOString() });
    }

    const src = row || booking || {};
    console.log('[status POST] src.customerEmail:', src.customerEmail, 'src keys:', Object.keys(src));

      if (src.customerEmail) {
        const payload: CustomerEmailPayload = {
          bookingRef: src.id || bookingId || `VC-${transactionId || orderCode}`,
          customerName: src.customerName || 'Customer',
          customerEmail: src.customerEmail || '',
          customerPhone: src.customerPhone || '',
          fromText: src.fromText || src.fromLabel || '',
          toText: src.toText || src.toLabel || '',
          pickupAtIso: src.pickupAtIso || '',
          passengers: src.passengers ?? 1,
          luggage: src.luggage ?? 0,
          childSeats: src.childSeats ?? 0,
          vehicle: src.vehicle || 'taxi',
          flightNumber: src.flightNumber,
          notes: src.notes,
          totalEUR: src.totalEUR ?? 0,
          depositEUR: src.depositEUR ?? 0,
          remainderEUR: src.remainderEUR ?? 0,
          locale: src.locale || 'en',
        };
        await sendAllNotifications(payload);
      } else {
        console.warn('[status POST] paid but no customer email — cannot send notifications. booking keys:', Object.keys(src));
      }

      return NextResponse.json({
        id: row?.id ?? bookingId ?? null,
        status: 'paid',
        totalEUR: (row || booking)?.totalEUR ?? null,
        depositEUR: (row || booking)?.depositEUR ?? null,
        remainderEUR: (row || booking)?.remainderEUR ?? null,
        source: 'viva-direct'
      });
  }

  if (vivaStatus === 'failed') {
    return NextResponse.json({ id: row?.id ?? bookingId ?? null, status: 'cancelled', source: 'viva-direct' });
  }

  return NextResponse.json({
    id: row?.id ?? bookingId ?? null,
    status: row?.status ?? 'pending',
    source: 'pending'
  });
}

/** Keep GET for backward compat (the old polling used GET) */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const orderCode = req.nextUrl.searchParams.get('orderCode');

  if (!id && !orderCode) {
    return NextResponse.json({ error: 'missing_id_or_orderCode' }, { status: 400 });
  }

  let row = id ? await db.getById(id) : null;
  if (row && row.status === 'paid') {
    return NextResponse.json({ id: row.id, status: 'paid', source: 'db' });
  }

  const codeForViva = row?.vivaOrderCode ?? (orderCode ? Number(orderCode) : null);
  if (codeForViva) {
    const vivaStatus = await checkOrderStatus(codeForViva);
    if (vivaStatus === 'paid') return NextResponse.json({ status: 'paid', source: 'viva-direct' });
    if (vivaStatus === 'failed') return NextResponse.json({ status: 'cancelled', source: 'viva-direct' });
  }

  return NextResponse.json({ status: 'pending', source: 'pending' });
}
