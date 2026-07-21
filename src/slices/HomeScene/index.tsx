import type { Content } from "@prismicio/client";
import type { SliceComponentProps } from "@prismicio/react";
import { ScenePanel } from "@/components/scene-panel";
import { SocialSprite } from "@/components/social-sprite";
import { StackedHeadline } from "@/components/stacked-headline";
import { site, socialHandle } from "@/content/site";

export type HomeSceneProps = SliceComponentProps<Content.HomeSceneSlice>;

/**
 * One full-viewport beat of the Home scroll spine, sourced from the `page` document's
 * Slice Zone (SWBE-81). `index` — supplied by `<SliceZone>` — is also the panel's
 * position, which must match its `STATES` keyframe: `ScenePanel` reads `STATES[index]`
 * to place the copy, so the slices must be authored in `page.tsx#Home`'s `<SliceZone>`
 * source order (SWBE-160 guards it against `scene/states.ts`).
 *
 * The closing beat (`social_handle: true`) mirrors the reference outro: handle above
 * the headline — the docked 3D mark sits in the gap directly over it — then the
 * unlinked socials sprite. Its headline runs display-larger than the middle beats
 * (13vw on mobile against their 7vw), per the reference's own final-line override.
 */
export default function HomeScene({ slice, index }: HomeSceneProps) {
  const isClosingBeat = slice.variation === "default" && slice.primary.social_handle;

  return (
    <ScenePanel
      index={index}
      dataSliceType={slice.slice_type}
      dataSliceVariation={slice.variation}
    >
      {isClosingBeat && (
        // Handle only, no link: the owner has not supplied the social profile URLs yet
        // (SWBE-18 precondition 4), and a placeholder href would ship a link that goes
        // nowhere. Same for the sprite below — it links up with the real URLs.
        <p className="font-display mb-[clamp(0.75rem,1.4vw,1.375rem)] text-[clamp(0.75rem,1.1vw,1rem)] tracking-[0.06em]">
          {socialHandle}
        </p>
      )}

      {slice.variation === "introHero" ? (
        // The visible headline of the opening beat is the 3D wordmark, which lives in a
        // decorative canvas. The page still needs one real name for screen readers and
        // for the document outline.
        <h1 className="sr-only">{`${site.name} — ${slice.primary.tagline}`}</h1>
      ) : (
        <StackedHeadline
          lines={slice.primary.heading.map((item) => item.line ?? "")}
          className={
            isClosingBeat
              ? "font-display leading-[0.92] tracking-[-0.01em] text-[clamp(2.5rem,13vw,6rem)] md:text-[clamp(2rem,5.6vw,5.75rem)]"
              : "font-display text-[clamp(2.25rem,7vw,5.5rem)]"
          }
        />
      )}

      {slice.primary.body &&
        (slice.variation === "introHero" ? (
          // Reference intro paragraph: a narrow bottom-right block, quieter than the
          // wordmark it annotates.
          <p className="max-w-[30ch] text-[clamp(0.875rem,1.15vw,1.1875rem)] leading-[1.45] opacity-90">
            {slice.primary.body}
          </p>
        ) : (
          <p className="mt-6 text-base leading-relaxed md:text-lg">{slice.primary.body}</p>
        ))}

      {isClosingBeat && (
        <SocialSprite className="mx-auto mt-[clamp(1.25rem,2.4vw,2.5rem)] h-auto w-[78vw] md:w-[min(58vw,460px)]" />
      )}
    </ScenePanel>
  );
}
