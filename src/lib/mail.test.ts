import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "./mail";

const MAIL_ENV = [
  "GRAPH_TENANT_ID",
  "AZURE_TENANT_ID",
  "GRAPH_CLIENT_ID",
  "GRAPH_CLIENT_SECRET",
  "MAIL_SENDER",
  "MAIL_FROM_NAME",
];

function clearMailEnv() {
  for (const key of MAIL_ENV) delete process.env[key];
}

afterEach(() => {
  clearMailEnv();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendMail — stub when Graph is unconfigured", () => {
  beforeEach(() => {
    clearMailEnv();
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("logs and resolves outside production (local/dev/test)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    await expect(
      sendMail({ to: "a@acme.com", subject: "Hi", text: "body" }),
    ).resolves.toBeUndefined();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining("a@acme.com"));
  });

  it("rejects in production when no transport is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendMail({ to: "a@acme.com", subject: "Hi", text: "body" })).rejects.toThrow(
      /not configured/i,
    );
  });
});

describe("sendMail — Microsoft Graph transport", () => {
  // Two fetches per send: the client-credentials token, then /sendMail. We stub
  // fetch and assert the requests, so no network and no real tenant are involved.
  function okFetch() {
    return vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gtoken-1", expires_in: 3600 }),
      })
      .mockResolvedValue({ ok: true, status: 202, text: async () => "" });
  }

  beforeEach(() => {
    vi.resetModules(); // drop the module-scoped token cache between tests
    process.env.GRAPH_TENANT_ID = "tenant-abc";
    process.env.GRAPH_CLIENT_ID = "client-123";
    process.env.GRAPH_CLIENT_SECRET = "secret-xyz";
    process.env.MAIL_SENDER = "espace@big-emotion.com";
  });

  it("fetches a client-credentials token, then POSTs the message via Graph", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({ to: "visitor@example.com", subject: "Hi", html: "<p>x</p>" });

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe("https://login.microsoftonline.com/tenant-abc/oauth2/v2.0/token");
    expect(tokenInit.body.toString()).toContain("grant_type=client_credentials");
    expect(tokenInit.body.toString()).toContain("client_id=client-123");

    const [mailUrl, mailInit] = fetchMock.mock.calls[1];
    expect(mailUrl).toBe(
      "https://graph.microsoft.com/v1.0/users/espace%40big-emotion.com/sendMail",
    );
    expect(mailInit.headers.Authorization).toBe("Bearer gtoken-1");
    const payload = JSON.parse(mailInit.body);
    expect(payload.saveToSentItems).toBe(false);
    expect(payload.message.body).toEqual({ contentType: "HTML", content: "<p>x</p>" });
    expect(payload.message.toRecipients).toEqual([
      { emailAddress: { address: "visitor@example.com" } },
    ]);
    expect(payload.message.from.emailAddress.address).toBe("espace@big-emotion.com");
  });

  it("sends a plain-text body when only text is given", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({ to: "a@b.com", subject: "s", text: "hello" });

    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payload.message.body).toEqual({ contentType: "Text", content: "hello" });
  });

  it("sends as a per-call sender override, leaving MAIL_SENDER as the default", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({
      to: "hello@big-emotion.com",
      subject: "s",
      html: "<p>x</p>",
      sender: "hello@big-emotion.com",
    });

    const [mailUrl] = fetchMock.mock.calls[1];
    expect(mailUrl).toBe("https://graph.microsoft.com/v1.0/users/hello%40big-emotion.com/sendMail");
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payload.message.from.emailAddress.address).toBe("hello@big-emotion.com");
  });

  it("includes replyTo when provided", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({
      to: "a@b.com",
      subject: "s",
      html: "<p>x</p>",
      replyTo: { address: "visitor@example.com", name: "Ada" },
    });

    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payload.message.replyTo).toEqual([
      { emailAddress: { address: "visitor@example.com", name: "Ada" } },
    ]);
  });

  it("accepts AZURE_TENANT_ID as the tenant fallback", async () => {
    delete process.env.GRAPH_TENANT_ID;
    process.env.AZURE_TENANT_ID = "tenant-legacy";
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({ to: "a@b.com", subject: "s", html: "<p>x</p>" });

    expect(fetchMock.mock.calls[0][0]).toContain("/tenant-legacy/");
  });

  it("reuses the access token across sends (token fetched once)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "gtoken-1", expires_in: 3600 }),
      })
      .mockResolvedValue({ ok: true, status: 202, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await send({ to: "a@b.com", subject: "s", html: "<p>1</p>" });
    await send({ to: "c@d.com", subject: "s", html: "<p>2</p>" });

    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 2 sends
  });

  it("throws when Graph sendMail returns a non-OK response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "t", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => "Forbidden" });
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail: send } = await import("./mail");

    await expect(send({ to: "a@b.com", subject: "s", html: "<p>x</p>" })).rejects.toThrow(/403/);
  });
});
