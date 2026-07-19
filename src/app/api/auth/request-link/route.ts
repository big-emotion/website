import { NextRequest, NextResponse } from "next/server";
import { mintMagicLinkToken } from "@/lib/magic-link";
import { sendMail } from "@/lib/mail";

// Never differs by allowlist membership — that's the whole anti-enumeration point.
const NEUTRAL_MESSAGE =
  "Si cette adresse est provisionnée, un lien de connexion vient d'être envoyé.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (email) {
    const token = mintMagicLinkToken(email);
    if (token) {
      const base = process.env.PORTAL_BASE_URL ?? request.nextUrl.origin;
      const verifyUrl = `${base}/verify?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: email,
        subject: "Votre lien de connexion BIG EMOTION",
        text: `Clique sur ce lien pour te connecter : ${verifyUrl}`,
      });
    }
  }

  return NextResponse.json({ message: NEUTRAL_MESSAGE });
}
