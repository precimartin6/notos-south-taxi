import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Vercel Cron — schedule daily.
 * Deletes bookings older than (pickup time + 24h) for GDPR compliance.
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/cleanup-bookings", "schedule": "0 3 * * *" }] }
 */
export async function GET(req: NextRequest) {
  // simple auth — Vercel sends this header automatically for crons
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET || ''}` &&
      !req.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const old = await db.listOlderThan(cutoff);
  for (const r of old) await db.delete(r.id);
  return NextResponse.json({ deleted: old.length });
}
