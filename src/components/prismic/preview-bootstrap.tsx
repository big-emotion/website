"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPreviewSession } from "./preview-session";

/**
 * Turns an editor's Prismic preview session into a Next draft-mode session.
 *
 * This is the one thing `<PrismicPreview>` does that a visitor's page still needs: it
 * reads the `io.prismic.preview` cookie and calls `/api/preview`, which is what actually
 * enables draft mode. Everything else it does — the floating toolbar, the live-refresh
 * listeners — only matters once draft mode is on, and is loaded then (see
 * `prismic-toolbar.tsx`).
 *
 * For an ordinary visitor this renders nothing and issues no request.
 */
export function PrismicPreviewBootstrap({ repositoryName }: { repositoryName: string }) {
  const { refresh } = useRouter();

  useEffect(() => {
    if (!hasPreviewSession(document.cookie, repositoryName)) return;

    const controller = new AbortController();

    // `/api/preview` answers with a redirect to the previewed document. `redirect:
    // "manual"` keeps the fetch from following it — we only need the draft-mode cookie
    // it sets, then a refresh to re-render this page against the preview ref.
    fetch("/api/preview", { redirect: "manual", signal: controller.signal })
      .then((response) => {
        if (response.type === "opaqueredirect") refresh();
      })
      .catch(() => {
        // An aborted or failed bootstrap leaves the visitor on published content, which
        // is the correct thing to show when we cannot confirm a preview session.
      });

    return () => controller.abort();
  }, [repositoryName, refresh]);

  return null;
}
