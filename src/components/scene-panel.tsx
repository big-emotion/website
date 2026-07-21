import { type ReactNode } from "react";
import { STATES } from "@/components/scene/states";

/**
 * One full-viewport beat of the scroll spine (SWBE-123). There is exactly one panel per
 * `STATES` keyframe and they share the scroll position, so a panel never paints its own
 * background: the fixed `SceneCanvas` underlay owns the colour and `body[data-active]`
 * flips it as the scroll crosses into this panel.
 */
export function ScenePanel({
  index,
  children,
  dataSliceType,
  dataSliceVariation,
}: {
  index: number;
  children: ReactNode;
  /** Stamped on the root element when a slice renders the panel (repo convention — see
   *  `CaseChapter`), so the beat's origin is inspectable in the DOM. */
  dataSliceType?: string;
  dataSliceVariation?: string;
}) {
  return (
    <section
      data-scene={index}
      data-slice-type={dataSliceType}
      data-slice-variation={dataSliceVariation}
      className={`scene-panel relative flex min-h-[100svh] flex-col px-5 pt-28 pb-28 md:px-10 ${placementFor(index)}`}
    >
      <div className={contentFor(index)}>{children}</div>
    </section>
  );
}

// The bookend beats mirror the reference composition exactly. Intro: copy tucked
// bottom-right under the settled wordmark (all breakpoints — the reference does not
// re-place it on mobile). Final: block centred but pushed 10vh below middle so the
// docked 3D mark owns the gap above the handle. The middle beats keep mobile
// bottom-left — there is no half of a 375px viewport to take — and from `md:` claim
// the half the wordmark vacates: `STATES[i].x` is its side-slide, so a positive x
// (mark drifts right) sends the copy left, and vice versa.
function placementFor(index: number): string {
  if (index === 0) return "items-end justify-end";
  if (index === STATES.length - 1) return "items-center justify-center text-center";
  const wordmarkSlide = STATES[index].x;
  if (wordmarkSlide > 0) return "items-start justify-end md:items-start md:justify-center";
  if (wordmarkSlide < 0)
    return "items-start justify-end md:items-end md:justify-center md:text-right";
  return "items-start justify-end md:items-center md:text-center";
}

// The final block runs wider than the reading-width middle beats: its headline is
// display-scale and must not wrap short of the reference's three authored lines.
function contentFor(index: number): string {
  if (index === STATES.length - 1) return "max-w-[92vw] translate-y-[10vh]";
  return "max-w-[82vw] md:max-w-[36rem]";
}
