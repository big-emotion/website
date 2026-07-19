// Guard for /espace: unauthenticated -> redirect to /login; authenticated but
// requesting another client's space -> 404 (never 403 — don't confirm the
// other client's space even exists). Next.js 16 renamed `middleware` to
// `proxy`; it defaults to the Node.js runtime, so getEditorSession() (which
// reads cookies via next/headers) works here unmodified.
import { NextRequest, NextResponse } from "next/server";
import { getEditorSession } from "@/lib/session";

const ESPACE_PREFIX = "/espace";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ESPACE_PREFIX)) {
    return NextResponse.next();
  }

  const session = await getEditorSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestedClientId = pathname
    .slice(ESPACE_PREFIX.length + 1)
    .split("/")[0];

  if (requestedClientId && requestedClientId !== session.clientId) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/espace/:path*"],
};
