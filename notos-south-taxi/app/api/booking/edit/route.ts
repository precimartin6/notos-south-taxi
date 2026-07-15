import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, type BookingRow } from '@/lib/db';
import { vehicleNeedsAdvanceNotice, VAN_MIN_NOTICE_MINUTES } from '@/lib/pricing';
import { sendCustomerConfirmation, sendDriverNotification, type CustomerEmailPayload } from '@/lib/integrations/email';
import { notifyDriverNewBooking } from '@/lib/integrations/whatsapp';
import { rateLimit, clientIp, LIMITS } from '@/lib/ratelimit';

/**
 * Customer-facing self-service edit for details that don't affect price
 * (pickup time, flight number, notes, passenger/luggage/child-seat counts,
 * phone). Route and vehicle are not editable here since they'd require
 * re-quoting and reconciling the Viva deposit already charged.
 *
 * Same auth pattern as /api/booking/cancel: booking ID + matching email,
 * no separate login system exists.
 *
 * Body with no `patch` = lookup (returns current editable fields for
 * prefill). Body with `patch` = apply the edit.
 */
const EDIT_WINDOW_HOURS = 24; // matches the existing free-cancellation cutoff

const LookupSchema = z.object({ id: z.string().min(1), email: z.string().email() });

const PatchSchema = z.object({
  pickupAtIso: z.string().datetime().optional(),
  flightNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  passengers: z.number().int().min(1).max(24).optional(),
  luggage: z.number().int().min(0).max(20).optional(),
  childSeats: z.number().int().min(0).max(4).optional(),
  customerPhone: z.string().min(6).max(30).optional(),
});

const Schema = LookupSchema.extend({ patch: PatchSchema.optional() });

function editableFields(r: BookingRow) {
  return {
    pickupAtIso: r.pickupAtIso,
    flightNumber: r.flightNumber,
    notes: r.notes,
    passengers: r.passengers,
    luggage: r.luggage,
    childSeats: r.childSeats,
    customerPhone: r.customerPhone,
    // read-only context, shown but not editable here
    fromText: r.fromText,
    toText: r.toText,
    vehicle: r.vehicle,
    totalEUR: r.totalEUR,
    depositEUR: r.depositEUR,
    remainderEUR: r.remainderEUR,
  };
}

export async function POST(req: NextRequest) {
  if (!(await rateLimit(LIMITS.bookingEdit, clientIp(req)))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, email, patch } = parsed.data;

  const row = await db.getById(id);
  if (!row || row.customerEmail.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (row.status === 'cancelled') {
    return NextResponse.json({ error: 'cancelled' }, { status: 400 });
  }

  const hoursUntil = (new Date(row.pickupAtIso).getTime() - Date.now()) / 36e5;
  const editable = hoursUntil >= EDIT_WINDOW_HOURS;

  // Lookup mode: no patch, just return current values for prefill.
  if (!patch) {
    return NextResponse.json({ ok: true, editable, hoursUntil, fields: editableFields(row) });
  }

  if (!editable) {
    return NextResponse.json({ error: 'edit_window_passed', hoursUntil }, { status: 400 });
  }

  const nextPickupIso = patch.pickupAtIso ?? row.pickupAtIso;
  if (new Date(nextPickupIso).getTime() < Date.now()) {
    return NextResponse.json({ error: 'pickup_in_past' }, { status: 400 });
  }
  if (patch.pickupAtIso && vehicleNeedsAdvanceNotice(row.vehicle as any)) {
    const minutesUntil = (new Date(nextPickupIso).getTime() - Date.now()) / 60000;
    if (minutesUntil < VAN_MIN_NOTICE_MINUTES) {
      return NextResponse.json({ error: 'van_notice', minNoticeMinutes: VAN_MIN_NOTICE_MINUTES }, { status: 400 });
    }
  }

  await db.setStatus(row.id, row.status, patch);
  const updated = await db.getById(row.id);
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const payload: CustomerEmailPayload = {
    bookingRef: updated.id,
    customerName: updated.customerName,
    customerEmail: updated.customerEmail,
    customerPhone: updated.customerPhone,
    fromText: updated.fromText,
    toText: updated.toText,
    pickupAtIso: updated.pickupAtIso,
    passengers: updated.passengers,
    luggage: updated.luggage,
    childSeats: updated.childSeats,
    vehicle: updated.vehicle,
    flightNumber: updated.flightNumber,
    notes: updated.notes,
    totalEUR: updated.totalEUR,
    depositEUR: updated.depositEUR,
    remainderEUR: updated.remainderEUR,
    locale: updated.locale,
  };

  // Only re-notify if the original notifications already went out (i.e. the
  // booking is paid and confirmed); a still-pending booking will get its
  // first notification with the up-to-date data once payment clears.
  // Per-booking throttle (on top of the IP limit): even a legitimate ID+email
  // holder can't spam the driver by editing in a loop, at most one driver
  // re-notification per booking per 5 minutes. Fails open if Upstash is down.
  const mayNotify = await rateLimit(LIMITS.editNotify, `notify:${updated.id}`);
  if (updated.status === 'paid' && updated.notifiedAt && mayNotify) {
    await Promise.all([
      sendCustomerConfirmation(payload, true).catch((e) => console.error('[edit] customer email failed:', e)),
      sendDriverNotification(payload, true).catch((e) => console.error('[edit] driver email failed:', e)),
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
      }, true).catch((e) => console.error('[edit] WhatsApp failed:', e)),
    ]);
  }

  return NextResponse.json({ ok: true, editable: true, fields: editableFields(updated) });
}
