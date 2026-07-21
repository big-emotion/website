import { SliceZone } from "@prismicio/react";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SceneMount } from "@/components/scene/scene-mount";
import type { Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { createClient, prismicLocale } from "@/prismicio";
import { components } from "@/slices";

// The home page is the scroll spine of the 3D scene, not a stack of sections: six
// full-viewport panels, one per `STATES` keyframe, over the fixed `SceneMount`
// underlay — which renders the static wordmark until a real model flips the
// `HAS_HERO_MODEL` gate (DEC-027) and pulls the Three.js runtime in via dynamic
// import. The Approach / Cases / Culture / Contact detail pages are their own routes
// now (SWBE-21) — this page only sets them up emotionally. The panels themselves are a
// Prismic Slice Zone (`page` document, uid "home") composed of `home_scene` slices
// (SWBE-81) — editors reorder or restyle the scroll spine without a deploy.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Opts the page back into static rendering — without it every next-intl call below
  // the tree reads headers() and the route silently becomes dynamic. `hasLocale` is
  // also what narrows the raw segment to a key of `content`.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const page = await fetchHomePage(locale);

  return (
    <>
      <SceneMount />
      <SliceZone slices={page.data.slices} components={components} />
    </>
  );
}

async function fetchHomePage(locale: Locale) {
  try {
    return await createClient().getByUID("page", "home", { lang: prismicLocale(locale) });
  } catch {
    // A locale with no "home" document is a 404, not a build failure — the same answer
    // an unknown path gets, so an untranslated draft can't leak its existence.
    notFound();
  }
}
