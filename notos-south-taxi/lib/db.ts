/**
 * Booking storage. In-memory in dev; swap `Memory` for a real DB in prod.
 * Using a thin adapter so you can drop in Vercel KV, Postgres, Supabase,
 * Neon, or whatever you prefer without touching the API routes.
 */

export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'completed';

export interface BookingRow {
  id: string;                      // booking ref, e.g. NST-A1B2C3
  vivaOrderCode?: number;
  status: BookingStatus;
  createdAt: string;
  pickupAtIso: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fromText: string;
  toText: string;
  vehicle: string;
  passengers: number;
  luggage: number;
  childSeats: number;
  flightNumber?: string;
  notes?: string;
  totalEUR: number;
  depositEUR: number;
  remainderEUR: number;
  locale: 'en' | 'el';
  /** when set, customer has been notified */
  notifiedAt?: string;
}

interface Adapter {
  insert(row: BookingRow): Promise<void>;
  getById(id: string): Promise<BookingRow | null>;
  getByVivaOrder(orderCode: number): Promise<BookingRow | null>;
  setStatus(id: string, status: BookingStatus, patch?: Partial<BookingRow>): Promise<void>;
  listOlderThan(beforeIso: string): Promise<BookingRow[]>;
  delete(id: string): Promise<void>;
}

class Memory implements Adapter {
  private map = new Map<string, BookingRow>();
  async insert(r: BookingRow) { this.map.set(r.id, r); }
  async getById(id: string) { return this.map.get(id) ?? null; }
  async getByVivaOrder(c: number) {
    for (const r of this.map.values()) if (r.vivaOrderCode === c) return r;
    return null;
  }
  async setStatus(id: string, status: BookingStatus, patch: Partial<BookingRow> = {}) {
    const r = this.map.get(id);
    if (!r) return;
    Object.assign(r, patch, { status });
  }
  async listOlderThan(beforeIso: string) {
    return [...this.map.values()].filter((r) => r.pickupAtIso < beforeIso);
  }
  async delete(id: string) { this.map.delete(id); }
}

declare global {
  // eslint-disable-next-line no-var
  var __notosDb: Adapter | undefined;
}

export const db: Adapter = global.__notosDb ?? (global.__notosDb = new Memory());

export function newBookingId(): string {
  const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += alpha[Math.floor(Math.random() * alpha.length)];
  return `NST-${id}`;
}
