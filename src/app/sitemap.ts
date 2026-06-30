import type { MetadataRoute } from "next";

// `output: "export"` refuses to emit a metadata route unless it is pinned to
// static generation, so opt in explicitly. No revalidate, no dynamic params:
// the route is evaluated once at build and frozen into out/sitemap.xml.
export const dynamic = "force-static";

// Prerendered to out/sitemap.xml at build time. This is a plain synchronous
// function with no dynamic params and no revalidate, so it is compatible with
// `output: "export"` (the whole site ships as static files to the n0c host).
//
// BIG EMOTION is a single-page scroll: there is exactly one indexable URL — the
// homepage. `trailingSlash: true` in next.config.ts makes the canonical home
// "/", so we list it with the slash to match the emitted out/index.html.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://big-emotion.com/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
