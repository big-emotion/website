import { exitPreview } from "@prismicio/next";

export const runtime = "nodejs";

/**
 * Closes the preview session by clearing the draft-mode cookie, putting this browser
 * back on the published content everyone else sees. The Prismic toolbar calls this URL
 * by default — it is `<PrismicPreview>`'s `exitPreviewURL`.
 */
export function GET(): Promise<Response> {
  return exitPreview();
}
