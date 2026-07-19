import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "./mail";

describe("mail lib (stub pending SWBE-37)", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalEnv ?? "test");
    vi.restoreAllMocks();
  });

  it("resolves and logs outside production (local/dev/test stub path)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(
      sendMail({ to: "a@acme.com", subject: "Hi", text: "body" }),
    ).resolves.toBeUndefined();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("a@acme.com"),
    );
  });

  it("rejects in production since no transport is wired yet (blocked on SWBE-37)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      sendMail({ to: "a@acme.com", subject: "Hi", text: "body" }),
    ).rejects.toThrow(/SWBE-37/);
  });
});
