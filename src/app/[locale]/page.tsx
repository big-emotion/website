import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SceneCanvas } from "@/components/scene/scene-canvas";
import { ScenePanel } from "@/components/scene-panel";
import { StackedHeadline } from "@/components/stacked-headline";
import { content, site, socialHandle } from "@/content/site";
import { routing } from "@/i18n/routing";

// The home page is the scroll spine of the 3D scene, not a stack of sections: six
// full-viewport panels, one per `STATES` keyframe, over the fixed `SceneCanvas`
// underlay. The Approach / Cases / Culture / Contact detail pages are their own routes
// now (SWBE-21) — this page only sets them up emotionally.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Opts the page back into static rendering — without it every next-intl call below
  // the tree reads headers() and the route silently becomes dynamic. `hasLocale` is
  // also what narrows the raw segment to a key of `content`.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { scenes, tagline } = content[locale];

  return (
    <>
      <SceneCanvas />

      {scenes.map((scene, index) => (
        <ScenePanel key={scene.id} index={index}>
          {scene.id === "intro" ? (
            // The visible headline of the opening beat is the 3D wordmark, which lives
            // in a decorative canvas. The page still needs one real name for screen
            // readers and for the document outline.
            <h1 className="sr-only">{`${site.name} — ${tagline}`}</h1>
          ) : (
            <StackedHeadline
              lines={scene.title}
              className="font-display text-[clamp(2.25rem,7vw,5.5rem)]"
            />
          )}

          {scene.body && (
            <p className="mt-6 text-base leading-relaxed md:text-lg">{scene.body}</p>
          )}

          {scene.id === "final" && (
            // Handle only, no link: the owner has not supplied the social profile URLs
            // yet (SWBE-18 precondition 4), and a placeholder href would ship a link
            // that goes nowhere. The icons row lands with the real URLs.
            <p className="font-display mt-8 text-lg tracking-[0.12em]">{socialHandle}</p>
          )}
        </ScenePanel>
      ))}
    </>
  );
}
