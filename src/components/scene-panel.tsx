import { Fragment, type ReactNode } from "react";
import { STATES } from "@/components/scene/states";

/**
 * One full-viewport beat of the scroll spine (SWBE-123). There is exactly one panel per
 * `STATES` keyframe and they share the scroll position, so a panel never paints its own
 * background: the fixed `SceneCanvas` underlay owns the colour and `body[data-active]`
 * flips it as the scroll crosses into this panel.
 */
export function ScenePanel({ index, children }: { index: number; children: ReactNode }) {
  return (
    <section
      data-scene={index}
      className={`scene-panel relative flex min-h-[100svh] flex-col items-start justify-end px-5 pt-28 pb-28 md:px-10 ${placementFor(index)}`}
    >
      <div className="max-w-[82vw] md:max-w-[36rem]">{children}</div>
    </section>
  );
}

/** A scene headline, one rendered line per authored entry (the designer's `<br>`). */
export function SceneHeadline({ lines }: { lines: readonly string[] }) {
  return (
    <h2 className="font-display text-[clamp(2.25rem,7vw,5.5rem)]">
      {lines.map((line, position) => (
        <Fragment key={line}>
          {/* Whitespace between two block spans collapses visually but keeps the
              accessible name a sentence instead of onerunonword. */}
          {position > 0 && " "}
          <span className="block">{line}</span>
        </Fragment>
      ))}
    </h2>
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
