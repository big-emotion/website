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
 * Title in white Bricolage rather than lemon `font-display`: colour hierarchy (lemon is
 * spent on the hero alone) plus BBH Hegarty's uppercase, ASCII-only cmap can't set a
 * sentence-case accented headline (DEC-023). The permanent tangerine underline and the
 * arrow that slides on hover carry the interaction; both survive `prefers-reduced-motion`.
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
    <article className="mt-14 border-t-[3px] border-paper pt-6 md:grid md:grid-cols-[1.1fr_0.9fr] md:items-start md:gap-12">
      <div>
        {/* Muted, not tangerine: tangerine on the blue field is ~3:1, which fails AA for
            text this small. Tangerine stays on the title underline and the hero chip
            (a fill), where 3:1 is the right bar. text-paper/70 clears ~5.4:1. */}
        <p className="text-sm font-bold uppercase tracking-wide text-paper/70">
          <span>{label}</span>
          {date && (
            <>
              <span aria-hidden="true"> · </span>
              <span>{date}</span>
            </>
          )}
        </p>
        <h2 className="mt-3 text-[clamp(1.8rem,9vw,3.4rem)] leading-[1.02] font-bold tracking-tight text-balance break-words">
          <Link href={href} className={`${HEADING_LINK} decoration-tangerine`}>
            {title}
          </Link>
        </h2>
      </div>
      <div className="mt-5 md:mt-0">
        <p className="max-w-prose text-lg leading-relaxed text-paper/90">{excerpt}</p>
        <Link
          href={href}
          className="group mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-lemon"
        >
          {readMore}
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
