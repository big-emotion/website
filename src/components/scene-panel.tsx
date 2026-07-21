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
      className={`scene-panel relative flex min-h-[100svh] flex-col items-start justify-end px-5 pt-28 pb-28 md:px-10 ${placementFor(index)}`}
    >
      <div className="max-w-[82vw] md:max-w-[36rem]">{children}</div>
    </section>
  );
}

// Mobile stays bottom-left throughout — there is no half of a 375px viewport to take.
// From `md:` the copy claims the half the wordmark vacates: `STATES[i].x` is its
// side-slide, so a positive x (mark drifts right) sends the copy left, and vice versa.
// The intro and closing keyframes leave the mark centred (x = 0), so their copy stays
// low and centred rather than fighting it for the middle of the screen.
function placementFor(index: number): string {
  const wordmarkSlide = STATES[index].x;
  if (wordmarkSlide > 0) return "md:items-start md:justify-center";
  if (wordmarkSlide < 0) return "md:items-end md:justify-center md:text-right";
  return "md:items-center md:text-center";
}
