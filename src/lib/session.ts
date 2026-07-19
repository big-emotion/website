// Real session lib for /espace, replacing the fail-closed getEditorSession()
// stub. Signs {userId, clientId} into an HttpOnly cookie with AUTH_SECRET
// (HMAC-SHA256) — no external JWT library, since Proxy/Route Handlers here
// always run on the Node.js runtime (see docs/adr/0005). Any tampering,
// expiry, or missing secret must yield null, never a partial session.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "espace_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionPayload {
  userId: string;
  clientId: string;
}

interface SignedPayload extends SessionPayload {
  exp: number;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function encodeSessionToken(
  payload: SessionPayload,
  secret: string,
  ttlMs: number = SESSION_TTL_MS,
): string {
  const signed: SignedPayload = { ...payload, exp: Date.now() + ttlMs };
  const data = Buffer.from(JSON.stringify(signed)).toString("base64url");
  const signature = sign(data, secret);
  return `${data}.${signature}`;
}

export function decodeSessionToken(
  token: string,
  secret: string,
): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;

  const expected = sign(data, secret);
  if (!safeEqual(expected, signature)) return null;

  let parsed: SignedPayload;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof parsed.exp !== "number" ||
    typeof parsed.userId !== "string" ||
    typeof parsed.clientId !== "string"
  ) {
    return null;
  }

  if (Date.now() > parsed.exp) return null;

  return { userId: parsed.userId, clientId: parsed.clientId };
}

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export async function createSession(user: SessionPayload): Promise<void> {
  const secret = requireSecret();
  const token = encodeSessionToken(user, secret);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Fail-closed: no secret, no cookie, a tampered/expired token — all yield null.
export async function getEditorSession(): Promise<SessionPayload | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return decodeSessionToken(token, secret);
}
