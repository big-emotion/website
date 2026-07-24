import { beforeEach, describe, expect, it, vi } from "vitest";

const getEditorSession = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/lib/session", () => ({ getEditorSession }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

// The handler reads nothing off the request — it derives everything from the
// session cookie — so it takes no parameter and the tests call it bare.
describe("POST /api/support/conversation-token", () => {
  beforeEach(() => {
    getEditorSession.mockReset();
    checkRateLimit.mockReset().mockReturnValue({ allowed: true, remaining: 4 });
  });

  it("returns 401 when there is no session", async () => {
    getEditorSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const res = await POST();

    expect(res.status).toBe(401);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    getEditorSession.mockResolvedValue({
      userId: "a@acme.com",
      clientId: "chancellerie",
    });
    checkRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    const { POST } = await import("./route");

    const res = await POST();

    expect(res.status).toBe(429);
  });

  it("mints a token scoped to the session's clientId on the happy path", async () => {
    getEditorSession.mockResolvedValue({
      userId: "a@acme.com",
      clientId: "chancellerie",
    });
    const { POST } = await import("./route");

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.clientId).toBe("chancellerie");
    expect(typeof body.conversationToken).toBe("string");
    expect(body.conversationToken.length).toBeGreaterThan(10);
  });

  it("keys the rate limit check on the session's userId", async () => {
    getEditorSession.mockResolvedValue({
      userId: "a@acme.com",
      clientId: "chancellerie",
    });
    const { POST } = await import("./route");

    await POST();

    expect(checkRateLimit).toHaveBeenCalledWith("a@acme.com", expect.any(Object));
  });
});
