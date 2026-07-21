import { notFound } from "next/navigation";

// With `localePrefix: "as-needed"` an unknown path like `/nonsense` is rewritten onto
// `/fr/nonsense` before it reaches the router, so it lands inside `[locale]` rather
// than on a top-level 404. This catch-all turns it back into a real 404 — rendered by
// `[locale]/not-found.tsx`, inside the locale layout, so the visitor still gets the
// branded page in their language instead of Next's bare default.
export default function CatchAllNotFound() {
  notFound();
}
