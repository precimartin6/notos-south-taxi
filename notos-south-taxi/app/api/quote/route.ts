import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quote } from '@/lib/pricing';
import { distanceKm } from '@/lib/integrations/maps';

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
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let custom_km: number | undefined;
  if ((!data.fromSlug || !data.toSlug) && data.fromAddress && data.toAddress) {
    const km = await distanceKm(data.fromAddress, data.toAddress);
    if (km != null) custom_km = km;
  }

  const result = quote({ ...data, custom_km } as any);
  return NextResponse.json(result);
}
