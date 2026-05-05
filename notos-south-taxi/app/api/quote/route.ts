import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quote } from '@/lib/pricing';
import { distanceKm } from '@/lib/integrations/maps';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  fromSlug: z.string().optional(),
  toSlug: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  vehicle: z.enum(['taxi', 'station_wagon', 'van', 'coach']),
  passengers: z.number().int().min(1).max(24),
  luggage: z.number().int().min(0).max(20),
  bigLuggage: z.number().int().min(0).max(10).optional(),
  childSeats: z.number().int().min(0).max(4),
  pickupAtIso: z.string()
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // DEBUG: log the body so we can see what's actually arriving on production.
  // View these in Vercel → your project → Logs → Runtime Logs.
  console.log('[quote] incoming body:', JSON.stringify(body));

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    console.log('[quote] schema rejected:', parsed.error.flatten());
    return NextResponse.json(
      { error: 'invalid', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Refuse to "quote" with no slugs AND no addresses — this is the case that
  // was returning the €15 minimum fare floor by accident. If the form was
  // misconfigured, we want a clear error instead of a wrong price.
  const hasSlugs = data.fromSlug && data.toSlug;
  const hasAddresses = data.fromAddress && data.toAddress;
  if (!hasSlugs && !hasAddresses) {
    console.log('[quote] no slugs and no addresses — refusing to quote');
    return NextResponse.json(
      { error: 'missing_route', message: 'Pickup and destination are required' },
      { status: 400 }
    );
  }

  let custom_km: number | undefined;
  if (!hasSlugs && hasAddresses) {
    const km = await distanceKm(data.fromAddress!, data.toAddress!);
    if (km != null) custom_km = km;
  }

  const result = quote({ ...data, custom_km } as any);
  console.log('[quote] result:', JSON.stringify({
    fromSlug: data.fromSlug, toSlug: data.toSlug, vehicle: data.vehicle,
    total: result.totalEUR, source: result.source
  }));
  return NextResponse.json(result);
}
