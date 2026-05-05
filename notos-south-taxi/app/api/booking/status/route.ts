import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkOrderStatus } from '@/lib/integrations/viva';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const orderCode = req.nextUrl.searchParams.get('orderCode');

  if (!id && !orderCode) {
    return NextResponse.json({ error: 'missing_id_or_orderCode' }, { status: 400 });
  }

  // 1. Try our DB first (the webhook will have updated this if it fired)
  let row = id ? await db.getById(id) : null;

  // 2. If we have a record AND it's already paid, return immediately
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

  // 3. Fallback: ask Viva directly. This handles two cases:
  //    a) The webhook hasn't fired yet (latency)
  //    b) Our in-memory DB lost the record because the booking was created
  //       in a different Lambda invocation than this status check
  //
  // We need an orderCode to ask Viva. If we have a DB row, use the one stored
  // there. Otherwise, the client must provide it as a query param (it's in the
  // URL Viva redirected back to).
  const codeForViva = row?.vivaOrderCode ?? (orderCode ? Number(orderCode) : null);

  if (codeForViva) {
    const vivaStatus = await checkOrderStatus(codeForViva);
    if (vivaStatus === 'paid') {
      // Promote our DB record if we have one — keeps webhook-vs-poll consistent
      if (row) {
        await db.setStatus(row.id, 'paid', { notifiedAt: new Date().toISOString() });
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
    // 'pending' or 'unknown' falls through to the response below
  }

  // 4. No conclusive answer yet — tell the client to keep polling
  return NextResponse.json({
    id: row?.id ?? null,
    status: row?.status ?? 'pending',
    totalEUR: row?.totalEUR ?? null,
    depositEUR: row?.depositEUR ?? null,
    remainderEUR: row?.remainderEUR ?? null,
    source: 'pending'
  });
}
