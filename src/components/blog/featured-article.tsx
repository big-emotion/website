import { HEADING_LINK } from "@/components/heading-link";
import { Link } from "@/i18n/navigation";

export interface FeaturedArticleProps {
  /** Locale-agnostic path — `Link` adds the locale prefix. */
  href: string;
  /** Eyebrow marking this as the promoted post (e.g. "À la une" / "Featured"). */
  label: string;
  title: string;
  excerpt: string;
  /** Already formatted for display (`formatArticleDate`). */
  date: string;
  /** CTA copy (e.g. "Lire l'article" / "Read the article"). */
  readMore: string;
}

/**
 * The single focal point below the hero (Direction B): the newest post, promoted out of
 * the index into a lead block with its excerpt and a call to read on. Everything else is
 * demoted to a calm date-and-title grid, so this is the one place the eye lands first.
 *
 * Title in the page's own ink rather than `font-display`: BBH Hegarty's uppercase,
 * ASCII-only cmap can't set a sentence-case accented headline (DEC-023). The permanent
 * underline in the association's accent and the arrow that slides on hover carry the
 * interaction; both survive `prefers-reduced-motion`.
 *
 * Nothing here names a colour. The blog wears a different association on every article
 * (`brand-pairings.ts`), so the block inherits its ink and reaches for the accent by
 * custom property — a hardcoded `text-paper` would be invisible the moment the page
 * drew a paper surface.
 */
export function FeaturedArticle({
  href,
  label,
  title,
  excerpt,
  date,
  readMore,
}: FeaturedArticleProps) {
  return (
    <article className="border-t-[3px] border-current pt-6 md:grid md:grid-cols-[1.1fr_0.9fr] md:items-start md:gap-12">
      <div>
        {/* Muted ink, not the accent: the accent is chosen against the 3:1 furniture
            floor, which fails AA for text this small. It stays on the title underline
            and the hero chip (a fill), where 3:1 is the right bar. */}
        <p className="text-sm font-bold uppercase tracking-wide opacity-70">
          <span>{label}</span>
          {date && (
            <>
              <span aria-hidden="true"> · </span>
              <span>{date}</span>
            </>
          )}
        </p>
        <h2 className="mt-3 text-[clamp(1.8rem,9vw,3.4rem)] leading-[1.02] font-bold tracking-tight text-balance break-words">
          <Link href={href} className={`${HEADING_LINK} decoration-[var(--blog-accent)]`}>
            {title}
          </Link>
        </h2>
      </div>
      <div className="mt-5 md:mt-0">
        <p className="max-w-prose text-lg leading-relaxed opacity-90">{excerpt}</p>
        {/* The label carries the underline rather than the link box: an inline-flex
            container blockifies its children, and the decoration would never render. */}
        <Link
          href={href}
          className="group mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
        >
          <span className="underline decoration-[var(--blog-accent)] decoration-2 underline-offset-4">
            {readMore}
          </span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:translate-x-1.5"
          >
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
