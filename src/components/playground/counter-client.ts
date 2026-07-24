// Client-side batcher for the Playground collective counter (SWBE-216/REQ-042):
// coalesces local play events into one POST per flush window instead of
// one per interaction, so a rapid burst of taps produces a single request. A failed
// or slow request never blocks or errors the playground UI — it's a nice-to-have
// aggregate, not part of the effect itself.

const ENDPOINT = "/api/playground/counter";
const FLUSH_INTERVAL_MS = 4_000;

/** Dispatched on `window` with `{ total }` after a flush round-trips a fresh total, so
 *  `CounterChip` can update without polling. Only the fetch path can fire it — sendBeacon
 *  never returns a response body, and that path only runs on unload anyway. */
export const COUNTER_UPDATED_EVENT = "playground-counter:updated";

function notifyUpdated(total: number): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(COUNTER_UPDATED_EVENT, { detail: { total } }));
}

export type CounterBatcher = {
  /** Queues one local interaction (e.g. one tap) for `effectId`; batched, not sent immediately. */
  recordPlay: (effectId: string, amount?: number) => void;
  /** Sends every pending increment as one batched request and clears the queue. */
  flush: () => void;
};

export function createCounterBatcher(
  options: { endpoint?: string; flushIntervalMs?: number } = {},
): CounterBatcher {
  const endpoint = options.endpoint ?? ENDPOINT;
  const flushIntervalMs = options.flushIntervalMs ?? FLUSH_INTERVAL_MS;

  let pending = new Map<string, number>();
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let unloadListenerAttached = false;

  function attachUnloadListener(): void {
    if (unloadListenerAttached || typeof window === "undefined") return;
    unloadListenerAttached = true;
    window.addEventListener("pagehide", flush);
  }

  function scheduleFlush(): void {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, flushIntervalMs);
  }

  function recordPlay(effectId: string, amount = 1): void {
    pending.set(effectId, (pending.get(effectId) ?? 0) + amount);
    attachUnloadListener();
    scheduleFlush();
  }

  function flush(): void {
    if (pending.size === 0) return;
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    const increments = Array.from(pending, ([effectId, amount]) => ({ effectId, amount }));
    pending = new Map();
    send(increments);
  }

  function send(increments: { effectId: string; amount: number }[]): void {
    const payload = JSON.stringify({ increments });

    // sendBeacon survives page unload (the pagehide flush); the interval flush uses
    // fetch with keepalive so the request still completes if the tab closes right after.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    if (typeof fetch === "undefined") return;
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (data && typeof (data as { total?: unknown }).total === "number") {
          notifyUpdated((data as { total: number }).total);
        }
      })
      .catch(() => {
        // Lost increments just don't count this time — never surface this to the UI.
      });
  }

  return { recordPlay, flush };
}

// Shared singleton every effect page uses — one flush queue per browser tab is enough.
export const playgroundCounter = createCounterBatcher();
