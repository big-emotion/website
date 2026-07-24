import { NextRequest, NextResponse } from "next/server";
import { mintMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

// Never differs by allowlist membership — that's the whole anti-enumeration point.
const NEUTRAL_MESSAGE =
  "Si cette adresse est provisionnée, un lien de connexion vient d'être envoyé.";

// Public, pre-auth, mail-sending endpoint (REQ-034): a tight per-IP cap.
const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

// Behind Traefik the visitor's address is the first X-Forwarded-For hop
// (mirrors src/app/api/contact/handler.ts:49).
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { allowed } = checkRateLimit(clientIp(request), RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json({ message: NEUTRAL_MESSAGE }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (email) {
    const token = mintMagicLinkToken(email);
    if (token) {
      const base = process.env.PORTAL_BASE_URL ?? request.nextUrl.origin;
      const verifyUrl = `${base}/verify?token=${encodeURIComponent(token)}`;
      // Fire-and-forget: awaiting sendMail here would make the response
      // slower for a provisioned email than an unprovisioned one, which is
      // exactly the timing oracle REQ-034 closes. The rejection is swallowed
      // — it must never surface to the caller.
      void sendMail({
        to: email,
        subject: "Ton lien de connexion BIG EMOTION",
        text: `Clique sur ce lien pour te connecter : ${verifyUrl}`,
      }).catch((error: unknown) => {
        console.error("[auth:request-link] sendMail failed", error);
      });
    }
  }

  return NextResponse.json({ message: NEUTRAL_MESSAGE });
}
