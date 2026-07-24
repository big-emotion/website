import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const consumeMagicLinkToken = vi.fn();
const createSession = vi.fn();

vi.mock("@/lib/magic-link", () => ({ consumeMagicLinkToken }));
vi.mock("@/lib/session", () => ({ createSession }));

function getRequest(url: string) {
  return new NextRequest(url);
}

describe("GET /(auth)/verify", () => {
  beforeEach(() => {
    consumeMagicLinkToken.mockReset();
    createSession.mockReset().mockResolvedValue(undefined);
  });

  it("consumes a valid token, creates a session, and redirects into the client's space", async () => {
    consumeMagicLinkToken.mockReturnValue({
      userId: "contact@big-emotion.com",
      clientId: "chancellerie",
    });
    const { GET } = await import("./route");

    const res = await GET(getRequest("http://localhost:3000/verify?token=tok_abc123"));

    expect(consumeMagicLinkToken).toHaveBeenCalledWith("tok_abc123");
    expect(createSession).toHaveBeenCalledWith({
      userId: "contact@big-emotion.com",
      clientId: "chancellerie",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/espace/chancellerie");
  });

  it("redirects to a neutral error state for an invalid/expired/consumed token", async () => {
    consumeMagicLinkToken.mockReturnValue(null);
    const { GET } = await import("./route");

    const res = await GET(getRequest("http://localhost:3000/verify?token=tok_bad"));

    expect(createSession).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=invalid");
  });

  it("redirects to the same neutral error state when no token is present", async () => {
    const { GET } = await import("./route");

    const res = await GET(getRequest("http://localhost:3000/verify"));

    expect(consumeMagicLinkToken).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=invalid");
  });
});
