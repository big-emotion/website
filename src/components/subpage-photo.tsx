"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { type SubpageId } from "./subpage-accents";
import { SUBPAGE_PHOTOS } from "./subpage-hero";

// Rotation range and parallax rate come from the designer's prototype (`js/site.js`).
const TILT_Y_DEGREES = 16;
const TILT_X_DEGREES = 12;
const PARALLAX_RATE = -0.12;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

// Assume motion is allowed for the server render: stripping the entrance from the markup
// up front would deny it to every motion-tolerant visitor. useSyncExternalStore swaps in
// the real client snapshot immediately after mount, which is how this codebase already
// reads the preference (see scene/scene-canvas.tsx).
function getServerReducedMotionSnapshot(): boolean {
  return false;
}

/**
 * The hero photo and its three effects: pointer tilt, scroll parallax, and the staggered
 * riseIn entrance (SWBE-22, ported from the preview).
 *
 * All three are inert under `prefers-reduced-motion: reduce` (REQ-008). The opt-out has
 * to cover the entrance animation too, not just the listeners: `riseIn` starts at
 * `opacity: 0`, so dropping the class is what keeps the hero visible rather than
 * invisible. These are CSS transforms driven by two listeners — DEC-005 keeps GSAP and
 * Lenis as the only animation libraries, and neither is needed here.
 */
export function SubpagePhoto({ page }: { page: SubpageId }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) return;

    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;

    const onPointerMove = (event: PointerEvent) => {
      const box = frame.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      media.style.setProperty("--subpage-photo-ry", `${+(px * TILT_Y_DEGREES).toFixed(2)}deg`);
      media.style.setProperty("--subpage-photo-rx", `${+(-py * TILT_X_DEGREES).toFixed(2)}deg`);
    };

    const onPointerLeave = () => {
      media.style.setProperty("--subpage-photo-ry", "0deg");
      media.style.setProperty("--subpage-photo-rx", "0deg");
    };

    const onScroll = () => {
      media.style.setProperty(
        "--subpage-photo-y",
        `${+(window.scrollY * PARALLAX_RATE).toFixed(1)}px`,
      );
    };

    frame.addEventListener("pointermove", onPointerMove);
    frame.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      frame.removeEventListener("pointermove", onPointerMove);
      frame.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion]);

  const photo = SUBPAGE_PHOTOS[page];

  return (
    <div
      ref={frameRef}
      data-testid="subpage-photo-frame"
      className={`subpage-photo-frame flex items-center justify-center ${
        reducedMotion ? "" : "subpage-rise subpage-rise--photo"
      }`}
    >
      {/* The transform lives on this wrapper rather than on the image, so the tilt and
          parallax read the same regardless of whether a real photo or the placeholder is
          inside — and so next/image keeps its own class and ref untouched. */}
      <div
        ref={mediaRef}
        data-testid="subpage-photo-media"
        className="subpage-photo-media max-h-[38vh] w-full md:max-h-[64vh]"
      >
        {photo ? (
          // The alt is empty on purpose: the photo sits beside the h1 and the lead that
          // carry the page's message, so it is decorative and belongs out of the
          // accessibility tree rather than announcing a description nobody asked for.
          <Image
            src={photo}
            alt=""
            priority
            className="max-h-[38vh] w-full object-contain md:max-h-[64vh]"
          />
        ) : (
          // Decorative stand-in until SWBE-91 delivers licensed photography. It holds the
          // same box as the real image so nothing shifts when the photo lands, and it
          // stays out of the accessibility tree because it carries no meaning.
          <div
            aria-hidden="true"
            data-testid="subpage-photo-placeholder"
            className="h-[38vh] w-full rounded-sm bg-current opacity-15 md:h-[64vh]"
          />
        )}
      </div>
    </div>
  );
}
