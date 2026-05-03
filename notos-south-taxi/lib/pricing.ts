import type { DestinationSlug } from './site-config';

export type VehicleType = 'taxi' | 'station_wagon' | 'van' | 'coach';

export interface QuoteRequest {
  fromSlug?: string;        // 'airport' | 'athens-centre' | etc.
  toSlug?: string;
  fromAddress?: string;     // when not a known slug
  toAddress?: string;
  vehicle: VehicleType;
  passengers: number;
  luggage: number;
  childSeats: number;
  pickupAtIso: string;      // ISO datetime
  bigLuggage?: number;
}

export interface QuoteResult {
  totalEUR: number;
  depositEUR: number;       // 15%
  remainderEUR: number;     // 85% paid in cash
  breakdown: { label: string; amountEUR: number }[];
  source: 'fixed' | 'distance';
  estimatedKm?: number;
}

/**
 * Fixed-price table (round trips priced separately if requested).
 * All prices in EUR for a STANDARD TAXI (4 pax, up to 3 luggage).
 * Vehicle and extras multipliers applied on top.
 *
 * Edit these values to match what the client wants to charge.
 */
export const FIXED_ROUTES: Record<string, number> = {
  'airport:athens-centre': 55,
  'airport:piraeus-port': 65,
  'airport:rafina-port': 45,
  'airport:sounio': 90,
  'airport:chalkida': 110,
  'airport:ancient-corinth': 130,
  'airport:korinthos': 140,
  'airport:nafplio': 180,
  'airport:mycenae': 170,
  'airport:porto-heli': 280,
  'airport:delphi': 260,
  'airport:patra': 280,
  'airport:kalamata': 380,
  'airport:meteora': 440,
  'airport:ioannina': 520,
  'airport:thessaloniki': 580
};

/** Minimum fare floor for the standard taxi (vehicle multipliers apply on top). */
export const MIN_TAXI_FARE_EUR = 15;

/** Vans + coaches need this much advance notice. */
export const VAN_MIN_NOTICE_MINUTES = 60;

/** Returns true if the chosen vehicle requires the advance-notice rule. */
export function vehicleNeedsAdvanceNotice(v: VehicleType): boolean {
  return v === 'van' || v === 'coach';
}

const VEHICLE_MULT: Record<VehicleType, number> = {
  taxi: 1,
  station_wagon: 1.15,
  van: 1.55,
  coach: 2.4
};

const PER_KM = 1.65;       // for custom routes
const BASE_FARE = 12;      // pickup fee
const NIGHT_SURCHARGE = 1.10; // 00:00–05:00
const CHILD_SEAT_FEE = 5;
const EXTRA_LUGGAGE_FEE = 3; // per piece beyond 3
const BIG_LUGGAGE_FEE = 6;   // per oversize bag

function isNight(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return h >= 0 && h < 5;
}

function routeKey(from?: string, to?: string) {
  if (!from || !to) return null;
  const a = from.toLowerCase();
  const b = to.toLowerCase();
  // Normalize "airport" both directions to a single key
  if (a === 'airport') return `airport:${b}`;
  if (b === 'airport') return `airport:${a}`;
  return `${a}:${b}`;
}

export function quote(req: QuoteRequest): QuoteResult {
  const breakdown: QuoteResult['breakdown'] = [];
  let base = 0;
  let source: QuoteResult['source'] = 'fixed';
  let estimatedKm: number | undefined;

  const key = routeKey(req.fromSlug, req.toSlug);
  if (key && FIXED_ROUTES[key]) {
    base = FIXED_ROUTES[key];
    breakdown.push({ label: `Fixed route fare`, amountEUR: base });
  } else if (req.fromAddress && req.toAddress) {
    // distance-based fallback. The actual km comes from Google Maps in the API route.
    // Here we just compute on whatever km the caller passed via custom_km.
    const km = (req as any).custom_km ?? 0;
    estimatedKm = km;
    base = BASE_FARE + km * PER_KM;
    source = 'distance';
    breakdown.push({ label: `Base fare`, amountEUR: BASE_FARE });
    breakdown.push({ label: `${km.toFixed(1)} km × €${PER_KM}`, amountEUR: km * PER_KM });
  } else {
    base = BASE_FARE;
    breakdown.push({ label: `Base fare`, amountEUR: BASE_FARE });
  }

  // Minimum-fare floor: short rides snap up to the minimum so we don't
  // dispatch a driver for less than this. Applied before vehicle/extras.
  if (base < MIN_TAXI_FARE_EUR) {
    const bump = MIN_TAXI_FARE_EUR - base;
    breakdown.push({ label: `Minimum fare adjustment`, amountEUR: bump });
    base = MIN_TAXI_FARE_EUR;
  }

  // vehicle
  const vMult = VEHICLE_MULT[req.vehicle];
  if (vMult !== 1) {
    const add = base * (vMult - 1);
    breakdown.push({ label: `Vehicle: ${req.vehicle.replace('_', ' ')}`, amountEUR: add });
    base += add;
  }

  // night surcharge
  if (isNight(req.pickupAtIso)) {
    const add = base * (NIGHT_SURCHARGE - 1);
    breakdown.push({ label: `Night surcharge (00:00–05:00)`, amountEUR: add });
    base += add;
  }

  // child seats
  if (req.childSeats > 0) {
    const add = req.childSeats * CHILD_SEAT_FEE;
    breakdown.push({ label: `Child seat × ${req.childSeats}`, amountEUR: add });
    base += add;
  }

  // luggage
  const extra = Math.max(0, req.luggage - 3);
  if (extra > 0) {
    const add = extra * EXTRA_LUGGAGE_FEE;
    breakdown.push({ label: `Extra luggage × ${extra}`, amountEUR: add });
    base += add;
  }
  if (req.bigLuggage && req.bigLuggage > 0) {
    const add = req.bigLuggage * BIG_LUGGAGE_FEE;
    breakdown.push({ label: `Oversize luggage × ${req.bigLuggage}`, amountEUR: add });
    base += add;
  }

  const total = Math.round(base * 100) / 100;
  const deposit = Math.round(total * 0.15 * 100) / 100;
  const remainder = Math.round((total - deposit) * 100) / 100;

  return { totalEUR: total, depositEUR: deposit, remainderEUR: remainder, breakdown, source, estimatedKm };
}
