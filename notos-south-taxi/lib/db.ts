/**
 * Booking storage.
 *
 * Uses Vercel KV (Redis) when KV_REST_API_URL + KV_REST_API_TOKEN are set
 * (required in production so bookings survive across serverless invocations).
 * Falls back to in-memory in local dev when those vars are absent.
 *
 * Vercel KV setup: Dashboard → Storage → Create Database → KV → connect to project.
 * Env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are injected automatically.
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

// ─── In-memory adapter (dev / fallback) ──────────────────────────────────────

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

// ─── Vercel KV adapter (production) ──────────────────────────────────────────

const TTL_SECONDS = 60 * 60 * 24 * 60; // keep bookings for 60 days

class KVAdapter implements Adapter {
  // kv is imported lazily to avoid crashing when the package isn't installed
  private kv: any;

  constructor(kv: any) {
    this.kv = kv;
  }

  async insert(r: BookingRow) {
    await this.kv.set(`booking:id:${r.id}`, r, { ex: TTL_SECONDS });
    if (r.vivaOrderCode != null) {
      await this.kv.set(`booking:viva:${r.vivaOrderCode}`, r.id, { ex: TTL_SECONDS });
    }
  }

  async getById(id: string): Promise<BookingRow | null> {
    return (await this.kv.get(`booking:id:${id}`)) ?? null;
  }

  async getByVivaOrder(code: number): Promise<BookingRow | null> {
    const id: string | null = await this.kv.get(`booking:viva:${code}`);
    if (!id) return null;
    return this.getById(id);
  }

  async setStatus(id: string, status: BookingStatus, patch: Partial<BookingRow> = {}) {
    const row = await this.getById(id);
    if (!row) return;
    const updated: BookingRow = { ...row, ...patch, status };
    await this.kv.set(`booking:id:${id}`, updated, { ex: TTL_SECONDS });
    // index by viva order code if newly set
    if (updated.vivaOrderCode != null && row.vivaOrderCode == null) {
      await this.kv.set(`booking:viva:${updated.vivaOrderCode}`, id, { ex: TTL_SECONDS });
    }
  }

  async listOlderThan(_beforeIso: string): Promise<BookingRow[]> {
    // KV doesn't support range scans; cleanup cron is a no-op with KV
    return [];
  }

  async delete(id: string) {
    const row = await this.getById(id);
    if (row?.vivaOrderCode != null) {
      await this.kv.del(`booking:viva:${row.vivaOrderCode}`);
    }
    await this.kv.del(`booking:id:${id}`);
  }
}

// ─── Adapter selection ────────────────────────────────────────────────────────

function buildAdapter(): Adapter {
  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const { createClient } = require('@vercel/kv') as typeof import('@vercel/kv');
      const kv = createClient({ url: kvUrl, token: kvToken });
      console.log('[db] Using Vercel KV adapter');
      return new KVAdapter(kv);
    } catch {
      console.warn('[db] @vercel/kv not installed — falling back to in-memory DB (bookings will not survive restarts)');
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[db] KV_REST_API_URL / KV_REST_API_TOKEN not set — using in-memory DB. Bookings will be lost between serverless invocations. Set up Vercel KV to fix this.');
    }
  }

  return new Memory();
}

declare global {
  // eslint-disable-next-line no-var
  var __notosDb: Adapter | undefined;
}

export const db: Adapter = global.__notosDb ?? (global.__notosDb = buildAdapter());

export function newBookingId(): string {
  const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += alpha[Math.floor(Math.random() * alpha.length)];
  return `NST-${id}`;
}
