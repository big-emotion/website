import { describe, expect, it, vi } from "vitest";
import { buildContactMessage, sendContactEmail } from "./contact-mail";

describe("buildContactMessage", () => {
  it("addresses contact@ with an aligned envelope sender and a reply-to the sender", () => {
    const message = buildContactMessage({
      name: "Ada",
      email: "ada@example.com",
      message: "Bonjour",
    });

    expect(message.to).toBe("contact@big-emotion.com");
    expect(message.from).toBe("BIG EMOTION <contact@big-emotion.com>");
    expect(message.envelope).toEqual({
      from: "contact@big-emotion.com",
      to: "contact@big-emotion.com",
    });
    expect(message.replyTo).toBe("Ada <ada@example.com>");
    expect(message.subject).toBe("Nouveau message de Ada — big-emotion.com");
    expect(message.text).toContain("Message :\nBonjour");
  });

  it("strips CR/LF so a value cannot inject an extra mail header", () => {
    const message = buildContactMessage({
      name: "Ada\r\nBcc: victim@example.com",
      email: "ada@example.com",
      message: "Bonjour",
    });

    expect(message.replyTo).not.toMatch(/[\r\n]/);
    expect(message.subject).not.toMatch(/[\r\n]/);
  });
});

describe("sendContactEmail", () => {
  it("hands the built message to the transport", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "1" });

    await sendContactEmail({ name: "Ada", email: "ada@example.com", message: "Hi" }, { sendMail });

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      to: "contact@big-emotion.com",
      replyTo: "Ada <ada@example.com>",
    });
  });

  it("propagates a transport failure so the caller can report it", async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error("smtp down"));

    await expect(
      sendContactEmail({ name: "Ada", email: "ada@example.com", message: "Hi" }, { sendMail }),
    ).rejects.toThrow("smtp down");
  });
});
