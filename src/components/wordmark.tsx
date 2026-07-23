// Text setting of the B!G EMOTION wordmark, kept for the 3D hero and the loader
// (scene/scene-canvas.tsx, scene/scene-mount.tsx): the giant scroll-story mark and the
// WebGL fallback are deliberately typographic. The real logo lockup lives in `Logo`
// (header + footer) — this stays text on purpose, so the two are not interchangeable.
export function Wordmark({
  className = "",
  stacked = true,
}: {
  className?: string;
  stacked?: boolean;
}) {
  return (
    <span
      className={`font-display inline-block leading-[0.82] ${className}`}
      aria-label="BIG EMOTION"
    >
      <span aria-hidden="true" className="block">
        B!G
      </span>
      {stacked && (
        <span aria-hidden="true" className="block">
          EMOTION
        </span>
      )}
    </span>
  );
}
