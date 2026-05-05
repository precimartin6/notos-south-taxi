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
  source: 'fixed' | 'distance' | 'call_for_quote';
  estimatedKm?: number;
}

/**
 * Fixed-price table. All prices in EUR for a STANDARD TAXI (4 pax, up to 3 luggage).
 * Vehicle and extras multipliers applied on top.
 *
 * Keys are ALPHABETICALLY SORTED pairs so we only need one entry per pair
 * (e.g. 'airport:athens-centre' covers both directions).
 *
 * The lookup function tries both orders: A:B and B:A.
 */
export const FIXED_ROUTES: Record<string, number> = {
  // ----- Airport routes -----
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
  'airport:thessaloniki': 580,

  // ----- Local neighbourhood routes (to/from airport implied by the lookup) -----
  'airport:vouliagmeni': 50,
  'airport:glyfada': 45,
  'airport:alimos': 45,
  'airport:piraeus': 60,

  // ----- Common inter-city / neighbourhood routes -----
  // Riviera ↔ Athens centre
  'athens-centre:vouliagmeni': 35,
  'athens-centre:glyfada': 25,
  'athens-centre:alimos': 20,

  // Riviera ↔ Piraeus
  'piraeus:vouliagmeni': 30,
  'piraeus:glyfada': 25,
  'piraeus:alimos': 18,
  'athens-centre:piraeus': 25,
  'piraeus-port:vouliagmeni': 35,
  'piraeus-port:glyfada': 28,
  'piraeus-port:alimos': 22,
  'piraeus-port:athens-centre': 28,

  // Neighbourhood ↔ ports
  'rafina-port:vouliagmeni': 55,
  'rafina-port:glyfada': 50,
  'rafina-port:alimos': 50,
  'rafina-port:athens-centre': 40,

  // Vouliagmeni/Glyfada ↔ destination routes
  'vouliagmeni:sounio': 45,
  'glyfada:sounio': 50,
  'vouliagmeni:korinthos': 95,
  'vouliagmeni:ancient-corinth': 90,
  'glyfada:korinthos': 100,
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

/**
 * Build lookup key(s) and find the first match in FIXED_ROUTES.
 * Tries both directions: A→B and B→A.
 */
function lookupFixedRoute(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  const a = from.toLowerCase();
  const b = to.toLowerCase();
  if (a === b) return null; // same location

  // Try: a:b, b:a, airport:X (both directions)
  const candidates = [
    `${a}:${b}`,
    `${b}:${a}`,
  ];
  // Also normalise: if either side is 'airport', make sure we try airport:other
  if (a === 'airport') candidates.push(`airport:${b}`);
  if (b === 'airport') candidates.push(`airport:${a}`);

  for (const key of candidates) {
    if (FIXED_ROUTES[key] != null) return FIXED_ROUTES[key];
  }
  return null;
}

export function quote(req: QuoteRequest): QuoteResult {
  const breakdown: QuoteResult['breakdown'] = [];
  let base = 0;
  let source: QuoteResult['source'] = 'fixed';
  let estimatedKm: number | undefined;

  const fixedPrice = lookupFixedRoute(req.fromSlug, req.toSlug);

  if (fixedPrice != null) {
    base = fixedPrice;
    breakdown.push({ label: `Fixed route fare`, amountEUR: base });
  } else if (req.fromAddress && req.toAddress) {
    // distance-based fallback. The actual km comes from Google Maps in the API route.
    const km = (req as any).custom_km ?? 0;
    if (km > 0) {
      estimatedKm = km;
      base = BASE_FARE + km * PER_KM;
      source = 'distance';
      breakdown.push({ label: `Base fare`, amountEUR: BASE_FARE });
      breakdown.push({ label: `${km.toFixed(1)} km × €${PER_KM}`, amountEUR: km * PER_KM });
    } else {
      // No distance data available — can't price this route
      return {
        totalEUR: 0,
        depositEUR: 0,
        remainderEUR: 0,
        breakdown: [{ label: 'Call for quote', amountEUR: 0 }],
        source: 'call_for_quote'
      };
    }
  } else if (req.fromSlug && req.toSlug) {
    // Both slugs provided but no fixed route exists for this pair,
    // and no custom addresses to compute distance from.
    // Instead of returning a wrong €15, tell the UI to show "call for quote".
    return {
      totalEUR: 0,
      depositEUR: 0,
      remainderEUR: 0,
      breakdown: [{ label: 'Call for quote', amountEUR: 0 }],
      source: 'call_for_quote'
    };
  } else {
    // No slugs and no addresses — shouldn't happen, but be safe
    return {
      totalEUR: 0,
      depositEUR: 0,
      remainderEUR: 0,
      breakdown: [{ label: 'Call for quote', amountEUR: 0 }],
      source: 'call_for_quote'
    };
  }

  // Minimum-fare floor
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
