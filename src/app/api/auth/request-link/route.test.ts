import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mintMagicLinkToken = vi.fn();
const sendMail = vi.fn();

vi.mock("@/lib/magic-link", () => ({ mintMagicLinkToken }));
vi.mock("@/lib/mail", () => ({ sendMail }));

const NEUTRAL_MESSAGE =
  "Si cette adresse est provisionnée, un lien de connexion vient d'être envoyé.";

function postRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/auth/request-link", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/request-link", () => {
  beforeEach(() => {
    mintMagicLinkToken.mockReset();
    sendMail.mockReset().mockResolvedValue(undefined);
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
});
