import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mintMagicLinkToken = vi.fn();
const sendMail = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/lib/magic-link", () => ({ mintMagicLinkToken }));
vi.mock("@/lib/mail", () => ({ sendMail }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

const NEUTRAL_MESSAGE =
  "Si cette adresse est provisionnée, un lien de connexion vient d'être envoyé.";

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/auth/request-link", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/auth/request-link", () => {
  beforeEach(() => {
    mintMagicLinkToken.mockReset();
    sendMail.mockReset().mockResolvedValue(undefined);
    checkRateLimit.mockReset().mockReturnValue({ allowed: true, remaining: 4 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mints and sends a token for a provisioned email, returns the neutral message", async () => {
    mintMagicLinkToken.mockReturnValue("tok_abc123");
    const { POST } = await import("./route");

    const res = await POST(postRequest({ email: "contact@big-emotion.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: NEUTRAL_MESSAGE });
    expect(mintMagicLinkToken).toHaveBeenCalledWith("contact@big-emotion.com");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "contact@big-emotion.com" }),
    );
    const [[mailArgs]] = sendMail.mock.calls;
    expect(mailArgs.text).toContain("tok_abc123");
  });

  it("returns the identical neutral message for an unknown email, without sending mail", async () => {
    mintMagicLinkToken.mockReturnValue(null);
    const { POST } = await import("./route");

    const res = await POST(postRequest({ email: "nobody@example.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: NEUTRAL_MESSAGE });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns the same neutral message for a missing/blank email", async () => {
    const { POST } = await import("./route");

    const res = await POST(postRequest({ email: "" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: NEUTRAL_MESSAGE });
    expect(mintMagicLinkToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("builds the verify URL from PORTAL_BASE_URL when configured", async () => {
    vi.stubEnv("PORTAL_BASE_URL", "https://big-emotion.com");
    mintMagicLinkToken.mockReturnValue("tok_xyz");
    const { POST } = await import("./route");

    await POST(postRequest({ email: "contact@big-emotion.com" }));

    const [[mailArgs]] = sendMail.mock.calls;
    expect(mailArgs.text).toContain("https://big-emotion.com/verify?token=tok_xyz");
  });

  it("returns 429 and sends no mail once the caller's IP is over the limit", async () => {
    checkRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    mintMagicLinkToken.mockReturnValue("tok_abc123");
    const { POST } = await import("./route");

    const res = await POST(
      postRequest(
        { email: "contact@big-emotion.com" },
        { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
      ),
    );

    expect(res.status).toBe(429);
    expect(mintMagicLinkToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("keys the rate limit check on the first X-Forwarded-For hop", async () => {
    const { POST } = await import("./route");

    await POST(
      postRequest(
        { email: "contact@big-emotion.com" },
        { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
      ),
    );

    expect(checkRateLimit).toHaveBeenCalledWith("203.0.113.9", expect.any(Object));
  });

  it("does not block the response on mail delivery (timing-neutral)", async () => {
    mintMagicLinkToken.mockReturnValue("tok_abc123");
    let mailSettled = false;
    sendMail.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            mailSettled = true;
            resolve();
          }, 50);
        }),
    );
    const { POST } = await import("./route");

    const res = await POST(postRequest({ email: "contact@big-emotion.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: NEUTRAL_MESSAGE });
    expect(mailSettled).toBe(false);
  });

  it("swallows a sendMail rejection instead of surfacing it to the caller", async () => {
    mintMagicLinkToken.mockReturnValue("tok_abc123");
    sendMail.mockRejectedValue(new Error("graph down"));
    const { POST } = await import("./route");

    const res = await POST(postRequest({ email: "contact@big-emotion.com" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: NEUTRAL_MESSAGE });
  });

  it("documents every auth env var in deploy/env.template", () => {
    const template = readFileSync(join(process.cwd(), "deploy/env.template"), "utf8");

    for (const name of [
      "AUTH_SECRET",
      "PORTAL_BASE_URL",
      "GRAPH_TENANT_ID",
      "GRAPH_CLIENT_ID",
      "GRAPH_CLIENT_SECRET",
      "MAIL_SENDER",
      "MAIL_FROM_NAME",
    ]) {
      expect(template).toContain(`${name}=`);
    }
  });
});
