import type { Content } from "@prismicio/client";
import type { SliceComponentProps } from "@prismicio/react";
import { ScenePanel } from "@/components/scene-panel";
import { StackedHeadline } from "@/components/stacked-headline";
import { site, socialHandle } from "@/content/site";

export type HomeSceneProps = SliceComponentProps<Content.HomeSceneSlice>;

/**
 * One full-viewport beat of the Home scroll spine, sourced from the `page` document's
 * Slice Zone (SWBE-81). `index` — supplied by `<SliceZone>` — is also the panel's
 * position, which must match its `STATES` keyframe: `ScenePanel` reads `STATES[index]`
 * to place the copy, so the slices must be authored in `page.tsx#Home`'s `<SliceZone>`
 * source order (SWBE-160 guards it against `scene/states.ts`).
 */
export default function HomeScene({ slice, index }: HomeSceneProps) {
  return (
    <ScenePanel
      index={index}
      dataSliceType={slice.slice_type}
      dataSliceVariation={slice.variation}
    >
      {slice.variation === "introHero" ? (
        // The visible headline of the opening beat is the 3D wordmark, which lives in a
        // decorative canvas. The page still needs one real name for screen readers and
        // for the document outline.
        <h1 className="sr-only">{`${site.name} — ${slice.primary.tagline}`}</h1>
      ) : (
        <StackedHeadline
          lines={slice.primary.heading.map((item) => item.line ?? "")}
          className="font-display text-[clamp(2.25rem,7vw,5.5rem)]"
        />
      )}

      {slice.primary.body && (
        <p className="mt-6 text-base leading-relaxed md:text-lg">{slice.primary.body}</p>
      )}

      {slice.variation === "default" && slice.primary.social_handle && (
        // Handle only, no link: the owner has not supplied the social profile URLs yet
        // (SWBE-18 precondition 4), and a placeholder href would ship a link that goes
        // nowhere. The icons row lands with the real URLs.
        <p className="font-display mt-8 text-lg tracking-[0.12em]">{socialHandle}</p>
      )}
    </ScenePanel>
  );
}
