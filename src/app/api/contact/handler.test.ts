import { describe, expect, it, vi } from "vitest";
import { handleContact } from "./handler";

function formRequest(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new Request("https://big-emotion.com/api/contact", { method: "POST", body, headers });
}

const allow = { check: () => false };
const valid = { name: "Ada", email: "ada@example.com", message: "Bonjour" };

describe("handleContact", () => {
  it("sends the mail and returns the JSON success contract for fetch posts", async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    const res = await handleContact(formRequest(valid, { "x-requested-with": "fetch" }), {
      rateLimiter: allow,
      send,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      message: "Message envoyé. On te répond sous 24 h.",
    });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toEqual(valid);
  });

  it("303-redirects a no-JS form post back to the contact anchor", async () => {
    const res = await handleContact(formRequest(valid), {
      rateLimiter: allow,
      send: vi.fn().mockResolvedValue(undefined),
    });

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/?sent=1#contact");
  });

  it("silently accepts a filled honeypot without sending mail", async () => {
    const send = vi.fn();

    const res = await handleContact(
      formRequest({ ...valid, website: "bot" }, { accept: "application/json" }),
      { rateLimiter: allow, send },
    );

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limiter blocks the IP", async () => {
    const res = await handleContact(formRequest(valid, { accept: "application/json" }), {
      rateLimiter: { check: () => true },
      send: vi.fn(),
    });

    expect(res.status).toBe(429);
  });

  it("rejects empty fields with 422 and the required message", async () => {
    const res = await handleContact(
      formRequest({ name: "", email: "", message: "" }, { accept: "application/json" }),
      { rateLimiter: allow, send: vi.fn() },
    );

    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("Tous les champs sont requis.");
  });

  it("rejects an invalid email with 422", async () => {
    const res = await handleContact(
      formRequest({ ...valid, email: "not-an-email" }, { accept: "application/json" }),
      { rateLimiter: allow, send: vi.fn() },
    );

    expect(res.status).toBe(422);
    expect((await res.json()).message).toBe("Adresse e-mail invalide.");
  });

  it("maps a mail transport failure to 500", async () => {
    const res = await handleContact(formRequest(valid, { accept: "application/json" }), {
      rateLimiter: allow,
      send: vi.fn().mockRejectedValue(new Error("smtp down")),
    });

    expect(res.status).toBe(500);
  });
});
