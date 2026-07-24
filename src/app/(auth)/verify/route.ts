import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkToken } from "@/lib/magic-link";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");
  const consumed = token ? consumeMagicLinkToken(token) : null;

  // Invalid, expired, already-consumed, or missing token — same neutral error
  // state in every case, never leaking which reason applied.
  if (!consumed) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  await createSession({
    userId: consumed.userId,
    clientId: consumed.clientId,
  });

  return NextResponse.redirect(new URL(`/espace/${consumed.clientId}`, request.url));
}
