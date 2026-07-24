"use client";

import { useEffect, useLayoutEffect } from "react";
import {
  ARTICLE_PAIRING_BOOTSTRAP,
  applyPairing,
  clearPairing,
  pickArticlePairing,
} from "./brand-pairings";

// The draw has to land before the browser paints the incoming route, which is what a
// layout effect guarantees and `useEffect` does not — the reader would otherwise catch
// one frame of the previous page's colours. On the server it would only warn that it
// does nothing, so the SSR pass falls back to the effect that is legal there.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Draws the brand association this article is painted in — a different one on each load.
 *
 * Two arrivals, two mechanisms, one draw either way. A direct hit is served pre-rendered
 * HTML, so the inline script below runs while that HTML is still parsing and the article
 * is already in its own colours by the first paint. A client-side navigation (the index,
 * or another article) never re-parses the document, so the effect draws instead — and
 * only when the properties are empty, which is precisely the case the script did not
 * already cover. Leaving the article hands the page back to the index's association.
 *
 * `uid` is a dependency rather than data: without it, moving between two articles would
 * keep whichever association the first one drew.
 *
 * React logs "Encountered a script tag while rendering React component" when a
 * client-side navigation renders the tag below — in development only, and it is stating
 * the premise this component is built on rather than reporting a fault: scripts rendered
 * on the client never run, which is exactly why the effect above exists. Production is
 * silent.
 */
export function ArticlePairing({ uid }: { uid: string }) {
  useBeforePaint(() => {
    const root = document.documentElement;
    if (!root.style.getPropertyValue("--blog-surface")) {
      applyPairing(root, pickArticlePairing());
    }
    return () => clearPairing(root);
  }, [uid]);

  return <script dangerouslySetInnerHTML={{ __html: ARTICLE_PAIRING_BOOTSTRAP }} />;
}
