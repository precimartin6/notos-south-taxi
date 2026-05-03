import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quote, vehicleNeedsAdvanceNotice, VAN_MIN_NOTICE_MINUTES } from '@/lib/pricing';
import { distanceKm } from '@/lib/integrations/maps';
import { createPaymentOrder } from '@/lib/integrations/viva';
import { db, newBookingId } from '@/lib/db';

const Schema = z.object({
  locale: z.enum(['en', 'el']),
  fromSlug: z.string().optional(),
  toSlug: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  fromLabel: z.string().min(1),
  toLabel: z.string().min(1),
  vehicle: z.enum(['taxi', 'station_wagon', 'van', 'coach']),
  passengers: z.number().int().min(1).max(24),
  luggage: z.number().int().min(0).max(20),
  bigLuggage: z.number().int().min(0).max(10).optional(),
  childSeats: z.number().int().min(0).max(4),
  pickupAtIso: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(6),
  flightNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true)
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Belt-and-braces: van/coach bookings need at least 1 hour notice.
  if (vehicleNeedsAdvanceNotice(d.vehicle)) {
    const minutesUntil = (new Date(d.pickupAtIso).getTime() - Date.now()) / 60000;
    if (minutesUntil < VAN_MIN_NOTICE_MINUTES) {
      return NextResponse.json(
        { error: 'van_notice', minNoticeMinutes: VAN_MIN_NOTICE_MINUTES },
        { status: 400 }
      );
    }
  }

  // recompute price server-side (never trust client)
  let custom_km: number | undefined;
  if ((!d.fromSlug || !d.toSlug) && d.fromAddress && d.toAddress) {
    const km = await distanceKm(d.fromAddress, d.toAddress);
    if (km != null) custom_km = km;
  }
  const q = quote({
    fromSlug: d.fromSlug,
    toSlug: d.toSlug,
    fromAddress: d.fromAddress,
    toAddress: d.toAddress,
    vehicle: d.vehicle,
    passengers: d.passengers,
    luggage: d.luggage,
    bigLuggage: d.bigLuggage,
    childSeats: d.childSeats,
    pickupAtIso: d.pickupAtIso,
    // @ts-ignore
    custom_km
  });

  const id = newBookingId();
  const row = {
    id,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    pickupAtIso: d.pickupAtIso,
    customerName: d.customerName,
    customerEmail: d.customerEmail,
    customerPhone: d.customerPhone,
    fromText: d.fromLabel,
    toText: d.toLabel,
    vehicle: d.vehicle,
    passengers: d.passengers,
    luggage: d.luggage,
    childSeats: d.childSeats,
    flightNumber: d.flightNumber,
    notes: d.notes,
    totalEUR: q.totalEUR,
    depositEUR: q.depositEUR,
    remainderEUR: q.remainderEUR,
    locale: d.locale
  };
  await db.insert(row);

  // Create Viva order for the 15% deposit
  let vivaOrder: { orderCode: number; checkoutUrl: string } | null = null;
  try {
    vivaOrder = await createPaymentOrder({
      amountCents: Math.round(q.depositEUR * 100),
      customerEmail: d.customerEmail,
      customerFullName: d.customerName,
      customerPhone: d.customerPhone,
      merchantTrns: id,
      customerTrns: `Notos South Taxi — booking ${id} (15% deposit)`,
      preferredLocale: d.locale === 'el' ? 'el-GR' : 'en-US'
    });
    await db.setStatus(id, 'pending', { vivaOrderCode: vivaOrder.orderCode });
  } catch (e) {
    console.error('[booking] viva order failed', e);
    return NextResponse.json({ error: 'payment_init_failed', bookingId: id }, { status: 502 });
  }

  return NextResponse.json({
    bookingId: id,
    deposit: q.depositEUR,
    total: q.totalEUR,
    remainder: q.remainderEUR,
    checkoutUrl: vivaOrder.checkoutUrl,
    orderCode: vivaOrder.orderCode
  });
}
