// Rewired onto the real session (was the getEditorSession() stub). Mints a
// placeholder token scoped to {userId, clientId} — Portal 4 (SWBE-29) extends
// this to mint an actual ElevenLabs conversation token for the client's agent.
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEditorSession } from "@/lib/session";

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };
const TOKEN_TTL_MS = 5 * 60 * 1000;

export async function POST(): Promise<NextResponse> {
  const session = await getEditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { allowed } = checkRateLimit(session.userId, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const conversationToken = randomBytes(24).toString("base64url");

  return NextResponse.json({
    conversationToken,
    clientId: session.clientId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
}
