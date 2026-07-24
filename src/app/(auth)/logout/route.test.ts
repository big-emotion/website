import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const destroySession = vi.fn();

vi.mock("@/lib/session", () => ({ destroySession }));

describe("POST /(auth)/logout", () => {
  beforeEach(() => {
    destroySession.mockReset().mockResolvedValue(undefined);
  });

  it("destroys the session and redirects to /login", async () => {
    const { POST } = await import("./route");

    const res = await POST(new NextRequest("http://localhost:3000/logout", { method: "POST" }));

    expect(destroySession).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
