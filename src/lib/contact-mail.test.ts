import { describe, expect, it, vi } from "vitest";
import { buildContactMail, sendContactEmail } from "./contact-mail";

describe("buildContactMail", () => {
  it("notifies hello@ with a reply-to the visitor and their message", () => {
    const mail = buildContactMail({
      name: "Ada",
      email: "ada@example.com",
      message: "Bonjour",
    });

    expect(mail.to).toBe("hello@big-emotion.com");
    expect(mail.replyTo).toEqual({ address: "ada@example.com", name: "Ada" });
    expect(mail.subject).toBe("Nouveau message de Ada — big-emotion.com");
    expect(mail.html).toContain("Bonjour");
  });

  it("escapes HTML so a message cannot inject markup into the notification", () => {
    const mail = buildContactMail({
      name: "Ada",
      email: "ada@example.com",
      message: "<script>alert(1)</script>",
    });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("strips CR/LF from the name so it can't break the subject or reply-to", () => {
    const mail = buildContactMail({
      name: "Ada\r\nEvil",
      email: "ada@example.com",
      message: "Bonjour",
    });

    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.replyTo.name).not.toMatch(/[\r\n]/);
  });
});

describe("sendContactEmail", () => {
  it("hands the built message to the shared mailer", async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await sendContactEmail({ name: "Ada", email: "ada@example.com", message: "Hi" }, send);

    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({
      to: "hello@big-emotion.com",
      sender: "hello@big-emotion.com",
      replyTo: { address: "ada@example.com", name: "Ada" },
    });
  });

  it("propagates a mailer failure so the route can map it to 500", async () => {
    const send = vi.fn().mockRejectedValue(new Error("graph down"));

    await expect(
      sendContactEmail({ name: "Ada", email: "ada@example.com", message: "Hi" }, send),
    ).rejects.toThrow("graph down");
  });
});
