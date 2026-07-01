// Pure-CSS load screen (brand book: a looping B!G intro before the site). No JS, no
// animation library: the overlay reveals the page via CSS alone, so content is never
// trapped behind a client bundle — essential for a static export. Decorative, so it's
// hidden from assistive tech. Reduced motion is handled in globals.css.
export function LoadScreen() {
  return (
    <div
      className="loadscreen fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-lemon"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="font-display px-3 text-[18vw] leading-none text-ink md:text-[12vw]"
          >
            B!G
          </span>
        ))}
      </div>
    </div>
  );
}
