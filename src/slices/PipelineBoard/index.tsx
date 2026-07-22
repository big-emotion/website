"use client";

import type { Content } from "@prismicio/client";
import { asText } from "@prismicio/client";
import type { SliceComponentProps } from "@prismicio/react";
import { useEffect, useRef, useSyncExternalStore } from "react";

export type PipelineBoardProps = SliceComponentProps<Content.PipelineBoardSlice>;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

// Assume motion is allowed for the server render, same rationale as scene-canvas.tsx
// and subpage-photo.tsx: useSyncExternalStore swaps in the real client snapshot
// immediately after mount.
function getServerReducedMotionSnapshot(): boolean {
  return false;
}

/**
 * The Ferry "pipeline board" figure (SWBE-191, ARCH-018): labelled Jira-style lanes
 * with a card that slides to the last lane as a reviewed-PR chip appears. One pass,
 * transform/opacity only (DEC-029) — CSS keyframes in globals.css do the animating,
 * this component only flips `data-visible` once the figure scrolls into view.
 *
 * Under `prefers-reduced-motion: reduce` the CSS forces the final state on its own
 * (no JS dependency); here we additionally skip attaching the observer so a
 * reduced-motion visitor never triggers it in the first place.
 */
export default function PipelineBoard({ slice }: PipelineBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) return;

    const board = boardRef.current;
    if (!board) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        board.dataset.visible = "true";
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(board);

    return () => observer.disconnect();
  }, [reducedMotion]);

  const lanes = slice.items;
  const laneCount = Math.max(lanes.length, 1);
  const caption = asText(slice.primary.caption);

  return (
    <figure
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="mt-12 md:mt-16"
    >
      <div
        ref={boardRef}
        data-testid="pipeline-board"
        className="pipeline-board"
        style={{ "--pipeline-lane-count": laneCount } as React.CSSProperties}
      >
        <div className="pipeline-board-lanes">
          {lanes.map((lane, index) => (
            <div key={index} className="pipeline-board-lane">
              <span className="pipeline-board-lane-label">{lane.lane_label}</span>
            </div>
          ))}
        </div>
        <div className="pipeline-board-card">{slice.primary.card_label}</div>
        <div className="pipeline-board-chip">{slice.primary.chip_label}</div>
      </div>
      {caption && <figcaption className="pipeline-board-caption">{caption}</figcaption>}
    </figure>
  );
}
