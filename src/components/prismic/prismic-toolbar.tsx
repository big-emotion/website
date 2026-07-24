import { PrismicPreview } from "@prismicio/next";
import { draftMode } from "next/headers";
import { prismicRepositoryName } from "@/prismicio";
import { PrismicPreviewBootstrap } from "./preview-bootstrap";

/**
 * Prismic's preview machinery, scoped to the people who actually use it.
 *
 * `<PrismicPreview>` injects `static.cdn.prismic.io/prismic.js` unconditionally — on
 * every page, for every visitor, editor or not. That is a third-party request carrying
 * the visitor's IP and user agent to a US-hosted CDN, on a site whose whole privacy
 * posture (self-hosted fonts, no analytics, no CDN) is built on making no such request.
 * It also made the cookie policy impossible to state honestly.
 *
 * So the toolbar loads only inside an open draft-mode session. Outside one, the bootstrap
 * below still watches for a preview cookie, so an editor arriving from the Prismic
 * dashboard enters preview exactly as before — and then gets the toolbar on the next
 * render, because draft mode is on by that point.
 */
export async function PrismicToolbar() {
  const repositoryName = prismicRepositoryName();

  return (await draftMode()).isEnabled ? (
    <PrismicPreview repositoryName={repositoryName} />
  ) : (
    <PrismicPreviewBootstrap repositoryName={repositoryName} />
  );
}
