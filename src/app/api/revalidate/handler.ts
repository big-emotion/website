import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { PRISMIC_CACHE_TAG } from "@/prismicio";

/**
 * Prismic publish webhook: drops the Prismic cache tag so the next request regenerates
 * the affected pages. No rebuild, no deploy (SWBE-80 / DEC-021).
 *
 * AUTHENTICATION — a shared secret, not a signature. Prismic does not sign webhook
 * bodies: it POSTs a JSON payload containing the plaintext `secret` configured on the
 * webhook, so there is nothing to verify an HMAC against. The comparison below is
 * therefore constant-time against the configured value, which is the strongest check
 * the provider makes possible. Treat the secret as a bearer credential accordingly.
 */

/** Prismic's event when the master ref moves — i.e. something was actually published. */
const PUBLISH_EVENT = "api-update";

export async function handlePrismicWebhook(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Malformed JSON body." });
  }

  if (!isRecord(payload) || !isAuthorised(payload.secret)) {
    return json(401, { error: "Unauthorized." });
  }

  // Prismic also pings on release and tag events, and on the dashboard's "Trigger it
  // now" button. Those authenticate but publish nothing, so there is nothing to drop.
  if (payload.type !== PUBLISH_EVENT) {
    return json(200, { revalidated: false });
  }

  // `expire: 0` rather than the recommended `"max"`: stale-while-revalidate would serve
  // the pre-publish page to the first visitor, and that visitor is usually the editor
  // checking their own change — which reads as "the webhook is broken". Expiring
  // immediately costs one blocking regeneration instead.
  revalidateTag(PRISMIC_CACHE_TAG, { expire: 0 });

  return json(200, { revalidated: true, tag: PRISMIC_CACHE_TAG });
}

/**
 * Fails closed: with no secret configured the route authorises nobody, rather than
 * reading "no secret required" as "everyone is welcome". The response is identical to a
 * wrong secret so a caller cannot tell a misconfigured server from a rejected one.
 */
function isAuthorised(provided: unknown): boolean {
  const expected = process.env.PRISMIC_WEBHOOK_SECRET;
  if (!expected || typeof provided !== "string") return false;

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, and the length is not the secret.
  if (providedBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(providedBytes, expectedBytes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}
