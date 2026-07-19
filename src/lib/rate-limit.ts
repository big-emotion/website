// Per-IP throttle ported from the retired public/contact.php: at most one send
// per MIN_INTERVAL and no more than MAX_PER_HOUR sends per hour. The store is
// in-memory (one process per container today); when the espace-client work adds
// Redis (SWBE-30), swap the store behind this same RateLimiter interface.

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
