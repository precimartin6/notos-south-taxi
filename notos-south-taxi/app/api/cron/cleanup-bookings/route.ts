import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Vercel Cron — schedule daily.
 * Deletes bookings older than (pickup time + 48h) for GDPR compliance.
 *
 * NOTE: under Upstash KV (production) deletion is enforced by a per-booking TTL
 * in lib/db.ts, and listOlderThan() is a no-op — so this cron only does real
 * work against the in-memory adapter (dev). Keep the 48h cutoff in sync with
 * RETENTION_BUFFER_SECONDS in lib/db.ts.
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/cleanup-bookings", "schedule": "0 3 * * *" }] }
 */
export async function GET(req: NextRequest) {
  // simple auth — Vercel sends this header automatically for crons
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET || ''}` &&
      !req.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const old = await db.listOlderThan(cutoff);
  for (const r of old) await db.delete(r.id);
  return NextResponse.json({ deleted: old.length });
}
