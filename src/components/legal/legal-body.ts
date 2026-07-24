/**
 * Chooses between the Prismic-authored legal text and the mandatory copy in
 * `src/content/legal.ts`.
 *
 * The two legal obligations this site carries — LCEN art. 6-III for the legal notice,
 * RGPD art. 13 for the privacy policy — do not lapse while the CMS is empty. A legal
 * route must therefore never be able to render blank, whatever state Prismic is in.
 */

/**
 * Below this, a body is a stub rather than a legal text. Every real section in
 * `content/legal.ts` clears it several times over, and an editor's "TODO" or an
 * accidentally-cleared field does not.
 */
const MINIMUM_AUTHORED_LENGTH = 50;

/**
 * @param bodyText the Prismic rich text already flattened with `asText`, so this stays
 *   free of Prismic types and testable on its own.
 */
export function hasPublishedBody(bodyText: string | null | undefined): boolean {
  return typeof bodyText === "string" && bodyText.trim().length >= MINIMUM_AUTHORED_LENGTH;
}
