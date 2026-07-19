// Single-use magic-link tokens bound to a provisioned (allowlisted) email.
// In-memory store: fine for one container instance; a Redis-backed store
// arrives with Portal 5 (SWBE-30), out of scope here.
import { randomBytes } from "node:crypto";
import { clientIdForEmail } from "@/config/clients";

const TOKEN_TTL_MS = 15 * 60 * 1000; // spec: TTL <= 15 minutes

interface TokenRecord {
  email: string;
  clientId: string;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenRecord>();

// Returns null for an unprovisioned email — callers must still send the same
// neutral response as the happy path (anti-enumeration guarantee).
export function mintMagicLinkToken(email: string): string | null {
  const clientId = clientIdForEmail(email);
  if (!clientId) return null;

  const token = randomBytes(32).toString("base64url");
  tokenStore.set(token, {
    email: email.trim().toLowerCase(),
    clientId,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

export interface ConsumedMagicLinkToken {
  userId: string;
  clientId: string;
}

// Single-use: the token is removed unconditionally on first lookup, so a
// replay of the same token — expired or not — always fails afterwards.
export function consumeMagicLinkToken(
  token: string,
): ConsumedMagicLinkToken | null {
  const record = tokenStore.get(token);
  tokenStore.delete(token);

  if (!record) return null;
  if (Date.now() > record.expiresAt) return null;

  return { userId: record.email, clientId: record.clientId };
}
