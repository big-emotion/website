import type { MetadataRoute } from "next";

// `output: "export"` refuses to emit a metadata route unless it is pinned to
// static generation, so opt in explicitly. No revalidate, no dynamic params:
// the route is evaluated once at build and frozen into out/robots.txt.
export const dynamic = "force-static";

// Prerendered to out/robots.txt at build time. Synchronous, no dynamic params
// and no revalidate, so it stays compatible with `output: "export"`.
//
// Nothing on the site is private, so every crawler gets the whole thing. The
// sitemap is advertised as an absolute URL because robots.txt has no notion of
// a base origin.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://big-emotion.com/sitemap.xml",
  };
}
