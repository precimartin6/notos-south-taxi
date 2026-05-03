import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

/**
 * Customer-facing cancellation. Free if more than 24h before pickup.
 * Inside 24h, the 15% deposit is forfeit (per terms).
 * (We don't auto-refund here — refund is handled in Viva dashboard.)
 */
const Schema = z.object({ id: z.string().min(1), email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const r = await db.getById(parsed.data.id);
  if (!r || r.customerEmail.toLowerCase() !== parsed.data.email.toLowerCase()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (r.status === 'cancelled') return NextResponse.json({ ok: true, alreadyCancelled: true });

  const hoursUntil = (new Date(r.pickupAtIso).getTime() - Date.now()) / 36e5;
  const refundEligible = hoursUntil >= 24;

  await db.setStatus(r.id, 'cancelled');
  return NextResponse.json({ ok: true, refundEligible, hoursUntil });
}
