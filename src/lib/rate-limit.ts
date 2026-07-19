// In-memory rate limiting. Fine for one container instance; a Redis-backed
// store arrives with Portal 5 (SWBE-30), out of scope here. Two throttles live
// here because they answer different questions:
//   - checkRateLimit: a fixed-window "N per window" cap (auth magic-link, the
//     support conversation-token route).
//   - createInMemoryRateLimiter: the contact form's "one send per interval AND
//     at most N per hour", ported for parity from the retired contact.php.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

// ── Contact form throttle ────────────────────────────────────────────────────
// The contact route needs two constraints at once (a minimum gap between sends
// and an hourly cap), which the fixed-window checkRateLimit above can't express,
// so it keeps its own store behind this interface.

export type RateLimiter = {
  /** Records an attempt for `key` and returns true when it must be blocked. */
  check(key: string): boolean;
};

const MIN_INTERVAL_MS = 20_000;
const MAX_PER_HOUR = 5;
const WINDOW_MS = 3_600_000;

export function createInMemoryRateLimiter(
  options: { minIntervalMs?: number; maxPerHour?: number; now?: () => number } = {},
): RateLimiter {
  const minIntervalMs = options.minIntervalMs ?? MIN_INTERVAL_MS;
  const maxPerHour = options.maxPerHour ?? MAX_PER_HOUR;
  const now = options.now ?? Date.now;
  const hitsByKey = new Map<string, number[]>();

  return {
    check(key) {
      const at = now();
      const recent = (hitsByKey.get(key) ?? []).filter((ts) => ts > at - WINDOW_MS);
      const tooSoon = recent.length > 0 && at - recent[recent.length - 1] < minIntervalMs;
      const tooMany = recent.length >= maxPerHour;

      // A blocked attempt isn't counted (matches contact.php), but keep the
      // pruned window so it stays bounded.
      hitsByKey.set(key, recent);
      if (tooSoon || tooMany) return true;

      recent.push(at);
      return false;
    },
  };
}

// Shared singleton for the contact route.
export const contactRateLimiter = createInMemoryRateLimiter();
