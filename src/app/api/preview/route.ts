import { redirectToPreviewURL } from "@prismicio/next";
import { draftMode } from "next/headers";
import type { NextRequest } from "next/server";
import { createClient, linkResolver } from "@/prismicio";

// Node.js runtime to match the rest of the app's route handlers (see docs/adr/0005).
export const runtime = "nodejs";

/**
 * Opens a Prismic preview session and sends the editor to the document they clicked
 * preview on.
 *
 * `draftMode().enable()` sets the `__prerender_bypass` cookie, which makes this browser
 * skip the pre-rendered output and render the page on demand; every other visitor keeps
 * being served the published, cached version. The Prismic toolbar calls this URL by
 * default — it is `<PrismicPreview>`'s `updatePreviewURL`.
 */
export async function GET(request: NextRequest): Promise<never> {
  const draft = await draftMode();
  draft.enable();

  return redirectToPreviewURL({ client: createClient(), request, linkResolver });
}
