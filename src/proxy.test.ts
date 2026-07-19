import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getEditorSession = vi.fn();

vi.mock("@/lib/session", () => ({ getEditorSession }));

function request(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

describe("proxy (guard middleware)", () => {
  beforeEach(() => {
    getEditorSession.mockReset();
  });

  it("passes through routes outside /espace without checking the session", async () => {
    const { proxy } = await import("./proxy");

    const res = await proxy(request("/"));

    expect(getEditorSession).not.toHaveBeenCalled();
    expect(res.headers.get("x-middleware-next")).toBe("1");
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
  });
});
