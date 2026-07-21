import { z } from "zod";
import { sendContactEmail } from "@/lib/contact-mail";
import { contactRateLimiter, type RateLimiter } from "@/lib/rate-limit";

// French copy + field limits ported from the retired public/contact.php so the
// JSON contract that contact-form.tsx relies on is unchanged.
const MESSAGES = {
  ok: "Message envoyé. On te répond sous 24 h.",
  honeypot: "Merci !",
  required: "Tous les champs sont requis.",
  tooLong: "Message trop long.",
  invalidEmail: "Adresse e-mail invalide.",
  rateLimited: "Trop de tentatives. Réessaie dans un instant.",
  failed: "L’envoi a échoué. Écris-nous à hello@big-emotion.com.",
} as const;

const submissionSchema = z.object({
  name: z.string().trim().min(1, MESSAGES.required).max(200, MESSAGES.tooLong),
  email: z
    .string()
    .trim()
    .min(1, MESSAGES.required)
    .max(200, MESSAGES.tooLong)
    .email(MESSAGES.invalidEmail),
  message: z.string().trim().min(1, MESSAGES.required).max(5000, MESSAGES.tooLong),
});

// contact.php surfaced one reason at a time — emptiness first, then length,
// then a bad address. Preserve that precedence so the user sees the same copy.
function firstMessage(error: z.ZodError): string {
  const reported = new Set(error.issues.map((issue) => issue.message));
  for (const message of [MESSAGES.required, MESSAGES.tooLong, MESSAGES.invalidEmail]) {
    if (reported.has(message)) return message;
  }
  return MESSAGES.required;
}

type Reply = { ok: boolean; message: string };

// fetch() submissions get JSON; a plain <form> post gets a redirect (no-JS path).
function wantsJson(request: Request): boolean {
  return (
    request.headers.get("x-requested-with")?.toLowerCase() === "fetch" ||
    (request.headers.get("accept") ?? "").includes("application/json")
  );
}

// Behind Traefik the visitor's address is the first X-Forwarded-For hop.
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function reply(request: Request, body: Reply, status: number): Response {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  // 303 See Other so the browser re-GETs. `/contact/` doesn't exist yet
  // (SWBE-22), so land on the homepage #contact anchor like contact.php did.
  const target = new URL(`/?sent=${body.ok ? "1" : "0"}#contact`, request.url);
  return new Response(null, { status: 303, headers: { location: target.href } });
}

export type ContactDeps = {
  rateLimiter?: RateLimiter;
  send?: typeof sendContactEmail;
};

// Collaborators are injected so tests exercise the whole handler deterministically
// without a real throttle clock or SMTP connection.
export async function handleContact(request: Request, deps: ContactDeps = {}): Promise<Response> {
  const rateLimiter = deps.rateLimiter ?? contactRateLimiter;
  const send = deps.send ?? sendContactEmail;

  const form = await request.formData();

  // Honeypot: a genuine visitor never fills `website`. Fake success to waste the bot.
  if ((form.get("website")?.toString() ?? "").trim() !== "") {
    return reply(request, { ok: true, message: MESSAGES.honeypot }, 200);
  }

  if (rateLimiter.check(clientIp(request))) {
    return reply(request, { ok: false, message: MESSAGES.rateLimited }, 429);
  }

  const parsed = submissionSchema.safeParse({
    name: (form.get("name") ?? "").toString(),
    email: (form.get("email") ?? "").toString(),
    message: (form.get("message") ?? "").toString(),
  });
  if (!parsed.success) {
    return reply(request, { ok: false, message: firstMessage(parsed.error) }, 422);
  }

  try {
    await send(parsed.data);
  } catch {
    return reply(request, { ok: false, message: MESSAGES.failed }, 500);
  }

  return reply(request, { ok: true, message: MESSAGES.ok }, 200);
}
