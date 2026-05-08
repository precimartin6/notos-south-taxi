import type { DestinationSlug } from './site-config';

export type VehicleType = 'taxi' | 'station_wagon' | 'van' | 'coach';

/** A route price can be a flat number or separate day/night prices. */
export type FixedRoutePrice = number | { day: number; night: number };

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
  source: 'fixed' | 'call_for_quote';
  estimatedKm?: number;
}

/** Returns the daytime price for display (e.g. "from €X" badges). */
export function extractDayPrice(p: FixedRoutePrice | undefined): number | undefined {
  if (p == null) return undefined;
  return typeof p === 'object' ? p.day : p;
}

/**
 * Fixed-price table. All prices in EUR for a STANDARD TAXI (4 pax, up to 3 luggage).
 * Vehicle and extras multipliers applied on top.
 *
 * Keys are ALPHABETICALLY SORTED pairs so we only need one entry per pair
 * (e.g. 'airport:athens-centre' covers both directions).
 *
 * Routes with {day, night} have explicit per-time prices; night surcharge is NOT
 * applied additionally.  Routes stored as a plain number get the 10% night
 * surcharge applied automatically at quote time.
 */
export const FIXED_ROUTES: Record<string, FixedRoutePrice> = {
  // ----- Airport routes — explicit day / night (midnight–05:00) pricing -----
  'airport:athens-centre':  { day: 50,  night: 60  },
  'airport:piraeus-port':   { day: 65,  night: 70  },
  'airport:vouliagmeni':    { day: 45,  night: 50  },
  'airport:glyfada':        { day: 45,  night: 50  },
  'airport:varkiza':        { day: 45,  night: 50  },
  'airport:lagonisi':       { day: 45,  night: 50  },
  'airport:anavysso':       { day: 45,  night: 50  },
  'airport:sounio':         { day: 50,  night: 60  },

  // ----- Airport → destination routes (shown on the "Where we go" page) -----
  'airport:rafina-port':    45,
  'airport:chalkida':       110,
  'airport:ancient-corinth':130,
  'airport:korinthos':      140,
  'airport:nafplio':        180,
  'airport:mycenae':        170,
  'airport:porto-heli':     280,
  'airport:delphi':         260,
  'airport:patra':          280,
  'airport:kalamata':       380,
  'airport:meteora':        440,
  'airport:ioannina':       520,
  'airport:thessaloniki':   580,

  // ----- Local routes — explicit day / night pricing -----
  'vouliagmeni:sounio':     { day: 55,  night: 60  },
  'athens-centre:sounio':   { day: 85,  night: 100 },
  'piraeus:sounio':         { day: 90,  night: 100 },
  'piraeus-port:sounio':    { day: 90,  night: 100 },
  'kifisia:vouliagmeni':    { day: 50,  night: 60  },
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
  van: 2,
  coach: 2.4
};

const NIGHT_SURCHARGE = 1.10; // applied only when route lacks explicit night price
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
function lookupFixedRoute(from?: string, to?: string): FixedRoutePrice | null {
  if (!from || !to) return null;
  const a = from.toLowerCase();
  const b = to.toLowerCase();
  if (a === b) return null;

  const candidates = [`${a}:${b}`, `${b}:${a}`];
  if (a === 'airport') candidates.push(`airport:${b}`);
  if (b === 'airport') candidates.push(`airport:${a}`);

  for (const key of candidates) {
    if (FIXED_ROUTES[key] != null) return FIXED_ROUTES[key];
  }
  return null;
}

export function quote(req: QuoteRequest): QuoteResult {
  // ── TEMPORARY TEST ROUTE — remove after payment verification ──────────────
    return {
      totalEUR: 0.04,
      depositEUR: 0.04,
      remainderEUR: 0,
      breakdown: [{ label: 'Test payment — remove after verification', amountEUR: 0.04 }],
      source: 'fixed'
    };
  }
  // ──────────────────────────────────────────────────────────────────────────

  const breakdown: QuoteResult['breakdown'] = [];
  let base = 0;
  const night = isNight(req.pickupAtIso);

  const fixedRouteData = lookupFixedRoute(req.fromSlug, req.toSlug);
  let hasExplicitNightPrice = false;

  if (fixedRouteData != null) {
    if (typeof fixedRouteData === 'object') {
      base = night ? fixedRouteData.night : fixedRouteData.day;
      hasExplicitNightPrice = true;
    } else {
      base = fixedRouteData;
    }
    breakdown.push({ label: `Fixed route fare`, amountEUR: base });
  } else {
    // Any combination not in the fixed table → contact driver for price.
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

  // vehicle multiplier
  const vMult = VEHICLE_MULT[req.vehicle];
  if (vMult !== 1) {
    const add = base * (vMult - 1);
    breakdown.push({ label: `Vehicle: ${req.vehicle.replace('_', ' ')}`, amountEUR: add });
    base += add;
  }

  // Night surcharge: only for routes WITHOUT explicit day/night pricing
  if (!hasExplicitNightPrice && night) {
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

  return { totalEUR: total, depositEUR: deposit, remainderEUR: remainder, breakdown, source: 'fixed' };
}
