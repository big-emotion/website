import { z } from "zod";
import { getTotal, incrementCounter, type CounterState } from "@/lib/playground-counter";
import { createInMemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";

// A generous upper bound: real clamping to a sane per-request cap happens in the lib
// (MAX_INCREMENT), so this only exists to reject payloads that couldn't possibly be a
// genuine batch (bot spam, a malformed client) rather than the everyday "over the cap"
// case, which the lib clamps instead of rejecting.
const incrementEntrySchema = z.object({
  effectId: z.string().trim().min(1).max(64),
  amount: z.number().int().positive().max(10_000),
});

const batchSchema = z.object({
  increments: z.array(incrementEntrySchema).min(1).max(20),
});

// Behind Traefik the visitor's address is the first X-Forwarded-For hop.
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// The client-side batcher (counter-client.ts) already coalesces rapid taps into one
// request, so this only needs to stop abuse from a single source, not normal play.
const counterRateLimiter = createInMemoryRateLimiter({ minIntervalMs: 1_000, maxPerHour: 300 });

export type CounterDeps = {
  rateLimiter?: RateLimiter;
  getTotal?: typeof getTotal;
  incrementCounter?: typeof incrementCounter;
};

export async function handleGetCounter(deps: CounterDeps = {}): Promise<Response> {
  const read = deps.getTotal ?? getTotal;
  const total = await read();
  return Response.json({ total });
}

// The counter must never block play: any failure here answers with a plain status
// code and never throws, so a slow disk or a bad payload can't take the playground
// down with it. counter-client.ts also treats every non-2xx as fire-and-forget.
export async function handlePostCounter(request: Request, deps: CounterDeps = {}): Promise<Response> {
  const rateLimiter = deps.rateLimiter ?? counterRateLimiter;
  const increment = deps.incrementCounter ?? incrementCounter;

  if (rateLimiter.check(clientIp(request))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  let state: CounterState;
  try {
    state = await increment(parsed.data.increments);
  } catch {
    return Response.json({ error: "Failed to persist." }, { status: 500 });
  }

  return Response.json({ total: state.total });
}
