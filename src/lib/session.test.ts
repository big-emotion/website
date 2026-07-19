import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const AUTH_SECRET = "test-secret-do-not-use-in-prod";

function makeFakeCookieStore() {
  const store = new Map<string, string>();
  return {
    get(name: string) {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      store.set(name, value);
    },
    delete(name: string) {
      store.delete(name);
    },
    __store: store,
  };
}

let fakeCookieStore = makeFakeCookieStore();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => fakeCookieStore),
}));

describe("session lib", () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    fakeCookieStore = makeFakeCookieStore();
    process.env.AUTH_SECRET = AUTH_SECRET;
    vi.resetModules();
  });

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
    vi.useRealTimers();
  });

  describe("encodeSessionToken / decodeSessionToken", () => {
    it("round-trips a valid payload", async () => {
      const { encodeSessionToken, decodeSessionToken } = await import(
        "./session"
      );
      const token = encodeSessionToken(
        { userId: "a@acme.com", clientId: "acme" },
        AUTH_SECRET,
      );
      expect(decodeSessionToken(token, AUTH_SECRET)).toEqual({
        userId: "a@acme.com",
        clientId: "acme",
      });
    });

    it("returns null for a tampered token", async () => {
      const { encodeSessionToken, decodeSessionToken } = await import(
        "./session"
      );
      const token = encodeSessionToken(
        { userId: "a@acme.com", clientId: "acme" },
        AUTH_SECRET,
      );
      const [data] = token.split(".");
      const tampered = `${data}x.${token.split(".")[1]}`;
      expect(decodeSessionToken(tampered, AUTH_SECRET)).toBeNull();
    });

    it("returns null when verified with the wrong secret", async () => {
      const { encodeSessionToken, decodeSessionToken } = await import(
        "./session"
      );
      const token = encodeSessionToken(
        { userId: "a@acme.com", clientId: "acme" },
        AUTH_SECRET,
      );
      expect(decodeSessionToken(token, "a-different-secret")).toBeNull();
    });

    it("returns null for an expired token", async () => {
      const { encodeSessionToken, decodeSessionToken } = await import(
        "./session"
      );
      const token = encodeSessionToken(
        { userId: "a@acme.com", clientId: "acme" },
        AUTH_SECRET,
        -1000,
      );
      expect(decodeSessionToken(token, AUTH_SECRET)).toBeNull();
    });

    it("returns null for a malformed token", async () => {
      const { decodeSessionToken } = await import("./session");
      expect(decodeSessionToken("not-a-valid-token", AUTH_SECRET)).toBeNull();
      expect(decodeSessionToken("", AUTH_SECRET)).toBeNull();
    });
  });

  describe("createSession / getEditorSession / destroySession", () => {
    it("round-trips a session through the cookie", async () => {
      const { createSession, getEditorSession } = await import("./session");
      await createSession({ userId: "a@acme.com", clientId: "acme" });
      expect(await getEditorSession()).toEqual({
        userId: "a@acme.com",
        clientId: "acme",
      });
    });

    it("sets the cookie HttpOnly, SameSite=lax and path=/", async () => {
      const { createSession } = await import("./session");
      const setSpy = vi.spyOn(fakeCookieStore, "set");
      await createSession({ userId: "a@acme.com", clientId: "acme" });
      expect(setSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    it("fails closed when no session cookie is present", async () => {
      const { getEditorSession } = await import("./session");
      expect(await getEditorSession()).toBeNull();
    });

    it("fails closed when AUTH_SECRET is missing, even with a valid cookie", async () => {
      const { createSession, getEditorSession } = await import("./session");
      await createSession({ userId: "a@acme.com", clientId: "acme" });
      delete process.env.AUTH_SECRET;
      expect(await getEditorSession()).toBeNull();
    });

    it("destroySession clears the cookie", async () => {
      const { createSession, destroySession, getEditorSession } =
        await import("./session");
      await createSession({ userId: "a@acme.com", clientId: "acme" });
      await destroySession();
      expect(await getEditorSession()).toBeNull();
    });

    it("createSession throws when AUTH_SECRET is not configured", async () => {
      delete process.env.AUTH_SECRET;
      const { createSession } = await import("./session");
      await expect(
        createSession({ userId: "a@acme.com", clientId: "acme" }),
      ).rejects.toThrow(/AUTH_SECRET/);
    });
  });
});
