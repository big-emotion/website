import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag }));

import { PRISMIC_CACHE_TAG } from "@/prismicio";
import { handlePrismicWebhook } from "./handler";

const SECRET = "correct-horse-battery-staple";

function webhookRequest(body: unknown): Request {
  return new Request("https://big-emotion.com/api/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const publishEvent = (secret: string | undefined) => ({
  type: "api-update",
  domain: "big-emotion",
  documents: ["Yl8v3REAACwAVoYB"],
  ...(secret === undefined ? {} : { secret }),
});

beforeEach(() => {
  vi.stubEnv("PRISMIC_WEBHOOK_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  revalidateTag.mockClear();
});

describe("Prismic publish webhook", () => {
  it("revalidates the Prismic cache tag when a document is published", async () => {
    const response = await handlePrismicWebhook(webhookRequest(publishEvent(SECRET)));

    expect(response.status).toBe(200);
    // Expired immediately, not marked stale: the editor refreshing after publishing must
    // get the new content, not one last stale-while-revalidate response.
    expect(revalidateTag).toHaveBeenCalledWith(PRISMIC_CACHE_TAG, { expire: 0 });
  });

  it("turns away a caller with the wrong secret", async () => {
    const response = await handlePrismicWebhook(webhookRequest(publishEvent("wrong-secret")));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("turns away a caller that sends no secret at all", async () => {
    const response = await handlePrismicWebhook(webhookRequest(publishEvent(undefined)));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  // A secret of a different length must not be distinguishable from a wrong one of the
  // same length, and must not crash the timing-safe comparison.
  it("turns away a secret of the wrong length without throwing", async () => {
    const response = await handlePrismicWebhook(webhookRequest(publishEvent("short")));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  // Fail closed: an unconfigured server must not revalidate for anyone, rather than
  // treating "no secret required" as "everyone is authorised".
  it("refuses every caller when the server has no secret configured", async () => {
    vi.stubEnv("PRISMIC_WEBHOOK_SECRET", "");

    const response = await handlePrismicWebhook(webhookRequest(publishEvent(SECRET)));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("never echoes the expected secret back to the caller", async () => {
    const response = await handlePrismicWebhook(webhookRequest(publishEvent("wrong-secret")));

    expect(await response.text()).not.toContain(SECRET);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await handlePrismicWebhook(webhookRequest("not json at all"));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  // Prismic's dashboard "Trigger it now" button sends this. It authenticates, so it
  // should be acknowledged — but nothing was published, so nothing needs regenerating.
  it("acknowledges a test ping without revalidating", async () => {
    const response = await handlePrismicWebhook(
      webhookRequest({ type: "test-trigger", domain: "big-emotion", secret: SECRET }),
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
