// Text rendering of the B!G EMOTION wordmark. Faithful enough for layout; the exact
// custom logo SVG from the brand kit can replace this in Phase 5 without touching callers.
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
