import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getEditorSession = vi.fn();

vi.mock("@/lib/session", () => ({ getEditorSession }));

function request(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

describe("proxy — locale routing", () => {
  beforeEach(() => {
    getEditorSession.mockReset();
  });

  it("serves French at the bare root by rewriting it onto the fr segment", async () => {
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/"));

    expect(getEditorSession).not.toHaveBeenCalled();
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe("/fr");
  });

  it("keeps unprefixed French routes unprefixed rather than redirecting them to /fr", async () => {
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/approach/"));

    // A rewrite, not a redirect: the visitor's URL stays the canonical French one.
    // Only the internal target gains the `/fr` segment. Its trailing slash is left
    // unasserted on purpose — next-intl normalises it from an env var the plugin sets
    // during `next build`, which never runs under Vitest.
    expect(res.headers.get("location")).toBeNull();
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toMatch(
      /^\/fr\/approach\/?$/,
    );
  });

  it("routes the /en prefix without touching the session", async () => {
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/en/approach/"));

    expect(getEditorSession).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

describe("proxy — surfaces excluded from locale routing", () => {
  beforeEach(() => {
    getEditorSession.mockReset();
  });

  // REQ-030: the authenticated surface is French-only and lives outside `[locale]`.
  // A rewrite here would point /login at a route segment that does not exist.
  it.each(["/login", "/logout", "/verify", "/api/contact"])(
    "passes %s through untouched, with no locale rewrite",
    async (pathname) => {
      const { proxy } = await import("./proxy");

      const res = await proxy(request(pathname));

      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );
});

describe("proxy — /espace guard", () => {
  beforeEach(() => {
    getEditorSession.mockReset();
  });

  it("redirects unauthenticated requests to /login", async () => {
    getEditorSession.mockResolvedValue(null);
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/espace/chancellerie"));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/espace/chancellerie");
  });

  it("returns 404 when a session tries to reach another client's space", async () => {
    getEditorSession.mockResolvedValue({
      userId: "a@acme.com",
      clientId: "chancellerie",
    });
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/espace/another-client/fichiers"));

    expect(res.status).toBe(404);
  });

  it("passes through when the session's clientId matches the requested space", async () => {
    getEditorSession.mockResolvedValue({
      userId: "a@acme.com",
      clientId: "chancellerie",
    });
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/espace/chancellerie/fichiers"));

    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
