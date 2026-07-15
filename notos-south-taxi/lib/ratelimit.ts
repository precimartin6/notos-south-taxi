/**
 * Distributed IP / key rate limiting, built on the Upstash Redis that already
 * backs the booking DB (KV_REST_API_URL + KV_REST_API_TOKEN). Mirrors the
 * pattern used in the sibling portfolio repo's contact form:
 *
 *  - Only active when Upstash is configured; otherwise every call is allowed,
 *    so local dev (in-memory DB, no KV) is unaffected.
 *  - Fails OPEN on any Redis error or timeout, so an outage can never block a
 *    booking, edit, cancellation, or address lookup.
 *
 * Falls back to the standard UPSTASH_REDIS_REST_* names if the KV_* ones aren't
 * set, so it also works if a separate Upstash instance is provided.
 */
import type { Ratelimit } from '@upstash/ratelimit';
import type { NextRequest } from 'next/server';

type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`;

export interface LimiterConfig {
  requests: number;
  window: Duration;
  prefix: string;
}

/** Per-endpoint limits. Keep windows/keys distinct so one route can't starve another. */
export const LIMITS = {
  // Creating a booking spins up a Viva order; keep this tight.
  bookingCreate: { requests: 8, window: '10 m', prefix: 'rl:booking:create' },
  // Edit/cancel are authed by ID+email; limit to blunt enumeration + abuse.
  bookingEdit: { requests: 10, window: '10 m', prefix: 'rl:booking:edit' },
  bookingCancel: { requests: 10, window: '10 m', prefix: 'rl:booking:cancel' },
  // Address autocomplete proxies the paid Geoapify API; protect the quota.
  // Generous because the client debounces and only fires at >=3 chars.
  places: { requests: 40, window: '1 m', prefix: 'rl:places' },
  // Per-booking driver re-notification throttle (keyed by booking id, not IP):
  // at most one driver email+WhatsApp per booking per 5 minutes on edits.
  editNotify: { requests: 1, window: '5 m', prefix: 'rl:booking:editnotify' },
} as const satisfies Record<string, LimiterConfig>;

const cache = new Map<string, Promise<Ratelimit | null>>();

function getLimiter(cfg: LimiterConfig): Promise<Ratelimit | null> {
  let p = cache.get(cfg.prefix);
  if (!p) {
    p = (async () => {
      const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return null;
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import('@upstash/ratelimit'),
        import('@upstash/redis'),
      ]);
      return new Ratelimit({
        redis: new Redis({ url, token, retry: { retries: 1, backoff: () => 200 } }),
        limiter: Ratelimit.slidingWindow(cfg.requests, cfg.window),
        prefix: cfg.prefix,
        analytics: false,
        timeout: 1000, // resolve as allowed within 1s rather than adding latency
      });
    })();
    cache.set(cfg.prefix, p);
  }
  return p;
}

/**
 * Returns true if the key is within the limit. Fails open (returns true) on any
 * error or when Upstash isn't configured.
 */
export async function rateLimit(cfg: LimiterConfig, key: string): Promise<boolean> {
  try {
    const limiter = await getLimiter(cfg);
    if (!limiter) return true;
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.error(`[ratelimit] check failed for ${cfg.prefix}, allowing request:`, err);
    return true;
  }
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
