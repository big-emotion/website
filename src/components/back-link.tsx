import { Link } from "@/i18n/navigation";

/**
 * The way out of a leaf page, back to the listing it was opened from. Born on the
 * Playground effect pages; lifted here so the blog articles wear the same affordance
 * rather than a second, slightly different one.
 *
 * Layout is the caller's job — this owns the link itself (display type, arrow, the 44px
 * touch target) and nothing around it. Colour is inherited, so it sits on the Playground's
 * ink band as happily as on whichever brand association an article drew.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-display inline-flex min-h-11 items-center text-sm uppercase tracking-wide hover:opacity-60"
    >
      <span aria-hidden="true" className="mr-2">
        &larr;
      </span>
      {label}
    </Link>
  );
}
