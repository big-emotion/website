// Two jobs, in this order:
//
//  1. Guard /espace: unauthenticated -> redirect to /login; authenticated but
//     requesting another client's space -> 404 (never 403 — don't confirm the
//     other client's space even exists).
//  2. Locale-route everything else through next-intl (`/` = FR, `/en/…` = EN).
//
// Next.js 16 renamed `middleware` to `proxy` and allows exactly one such file, so the
// two concerns compose here rather than living side by side. The proxy defaults to the
// Node.js runtime, so getEditorSession() (which reads cookies via next/headers) works
// unmodified.
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getEditorSession } from "@/lib/session";

const ESPACE_PREFIX = "/espace";

// The authenticated surfaces are French-only and live outside the `[locale]` segment
// (REQ-030). `config.matcher` already keeps them away from next-intl; this list is the
// second lock, so a matcher regression can't silently start rewriting /login to /fr/login.
const UNLOCALIZED_PREFIXES = ["/api", "/login", "/logout", "/verify", ESPACE_PREFIX];

const localeRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ESPACE_PREFIX)) {
    return guardEspace(request, pathname);
  }

  if (UNLOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  return localeRouting(request);
}

async function guardEspace(request: NextRequest, pathname: string): Promise<NextResponse> {
  const session = await getEditorSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestedClientId = pathname.slice(ESPACE_PREFIX.length + 1).split("/")[0];

  if (requestedClientId && requestedClientId !== session.clientId) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  // Wide enough for next-intl to see `/` and every marketing route — with
  // `localePrefix: "as-needed"` the unprefixed French paths must be matched, or they
  // never get a locale resolved. Excluded: the API, Next internals, the auth routes,
  // and any path with a file extension (robots.txt, sitemap.xml, icon.svg, the Draco
  // decoder under /draco/, the GLB). /espace stays matched so the guard above still runs.
  //
  // `/opengraph-image` is matched and harmlessly rewritten onto the default locale: it
  // is a metadata route with no locale-dependent behaviour, and it deliberately lives at
  // the app root rather than under `[locale]` so metadata advertises the card at its
  // canonical unprefixed URL. Under `[locale]` it resolved to `/fr/opengraph-image`,
  // which every other rule on this site redirects away from.
  matcher: ["/((?!api|_next|_vercel|login|logout|verify|.*\\..*).*)"],
};
