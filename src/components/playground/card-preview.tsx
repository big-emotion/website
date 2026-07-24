"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CardPreview as PreviewHandle, PreviewMotion } from "./preview/runtime";

/**
 * The live 3D sample inside a gallery card: the brand lockup playing a few seconds of
 * the effect the card opens (LUMIERE turns towards the pointer, POIDS LOURD drops, BIG
 * BANG blows apart). Hover or keyboard focus starts it; leaving returns it to rest.
 *
 * Nothing 3D is fetched until that first hover. The runtime — three.js, the Draco
 * decoder, the GLB — is behind a dynamic import fired from the activation effect, so a
 * visitor who scrolls past the gallery pays for none of it, and the three cards share
 * one decoded rig once any of them has asked for it.
 *
 * `children` is the resting card art, kept mounted underneath: it is what a phone shows
 * (no hover to trigger anything), what everyone sees before the first hover, and what
 * remains if the GLB never arrives.
 */
export function CardPreview({
  motion,
  active,
  children,
}: {
  motion: PreviewMotion;
  active: boolean;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<PreviewHandle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !active) {
      previewRef.current?.deactivate();
      return;
    }

    // Touch has no hover, so a card there could only ever pay for a WebGL context it
    // would never play. The resting art is the whole card on those devices.
    if (!window.matchMedia("(hover: hover)").matches) return;

    let cancelled = false;

    if (previewRef.current) {
      previewRef.current.activate();
      return;
    }

    import("./preview/runtime")
      .then(({ createCardPreview }) => createCardPreview(stage, motion))
      .then((preview) => {
        // Disposing here rather than keeping it: the pointer left before the GLB
        // arrived, so nothing should be holding a context open.
        if (cancelled) {
          preview.dispose();
          return;
        }
        previewRef.current = preview;
        setReady(true);
        preview.activate();
      })
      .catch(() => {
        // The card keeps its resting art. A preview that cannot load is not worth
        // telling anyone about — the effect behind the card still works.
      });

    return () => {
      cancelled = true;
    };
  }, [active, motion]);

  // Unmount is the only place the context is released; hovering away just stops the
  // loop, so coming back is instant instead of rebuilding the whole scene.
  useEffect(
    () => () => {
      previewRef.current?.dispose();
      previewRef.current = null;
    },
    [],
  );

  function trackPointer(event: React.PointerEvent<HTMLDivElement>) {
    const preview = previewRef.current;
    if (!preview) return;
    const box = event.currentTarget.getBoundingClientRect();
    preview.track(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      ((event.clientY - box.top) / box.height) * 2 - 1,
    );
  }

  // They cross-fade rather than stack: the flat lockup and the chrome one are the same
  // mark, so showing both at once reads as a doubled logo, not as a preview.
  const playing = ready && active;

  return (
    <div className="relative h-full w-full" onPointerMove={trackPointer}>
      <div
        className={`h-full w-full transition-opacity duration-300 motion-reduce:transition-none ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
      <div
        ref={stageRef}
        data-testid="card-preview-stage"
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
          playing ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
