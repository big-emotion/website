/**
 * Detects the cookie Prismic sets when an editor starts a preview.
 *
 * `<PrismicPreview>` does this itself, but only as a side effect of also injecting the
 * third-party toolbar script into every page for every visitor. We keep the detection and
 * drop the script (see `prismic-toolbar.tsx`), so the check has to live here.
 *
 * Kept free of browser globals so it can be tested against a plain cookie string.
 */

const PREVIEW_COOKIE = "io.prismic.preview";

/** The repository endpoint recorded in the cookie: `https://<name>.prismic.io/api/v2`. */
const REPOSITORY_ENDPOINT = /"https:\/\/([^".]+)\.prismic\.io/;

export function hasPreviewSession(cookieJar: string, repositoryName: string): boolean {
  const cookie = readCookie(cookieJar, PREVIEW_COOKIE);
  if (!cookie) return false;

  return REPOSITORY_ENDPOINT.exec(decodeURIComponent(cookie))?.[1] === repositoryName;
}

function readCookie(cookieJar: string, name: string): string | undefined {
  for (const pair of cookieJar.split(/;\s*/)) {
    const separator = pair.indexOf("=");
    if (separator > 0 && pair.slice(0, separator) === name) {
      return pair.slice(separator + 1);
    }
  }
  return undefined;
}
