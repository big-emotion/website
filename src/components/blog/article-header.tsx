import type { Locale } from "@/i18n/locales";

export interface ArticleHeaderProps {
  locale: Locale;
  title: string;
  /** Nature of the piece (e.g. "Strategie de marque") — same eyebrow role as case_study's `kind`. Omitted until a source field exists on the `article` type. */
  kind?: string;
  /** ISO 8601 date (e.g. "2026-07-21"); formatted for display, kept raw in `<time datetime>`. */
  date?: string;
  author?: string;
  readingTime?: string;
  /** The article's thesis (SWBE-190), reusing the existing `excerpt` field rather than a
   *  new Prismic field. Rendered as a focal "thesis sticker" pull-quote, promoted above
   *  body-copy weight so a scanning reader gets the point without reading every line. */
  thesis?: string;
}

/**
 * The branded hero for an article page. Direction B (SWBE-190): eyebrow, title, meta
 * line and thesis sticker are stepped apart by size, weight and space, not colour alone.
 */
export function ArticleHeader({ locale, title, kind, date, author, readingTime, thesis }: ArticleHeaderProps) {
  const formattedDate = date ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(date)) : null;
  const hasMetaLine = formattedDate || author || readingTime;

  return (
    <header className="border-b-2 border-current/30 pb-8">
      {/* Title and kind land in font-display slots: BBH Hegarty has an ASCII-only cmap
          (DEC-023), so Prismic authors must keep this copy unaccented. */}
      {kind && <p className="font-display text-sm uppercase tracking-wide opacity-70">{kind}</p>}
      <h1 className="font-display mt-2 text-[clamp(2rem,8vw,5rem)] [overflow-wrap:anywhere]">{title}</h1>
      {hasMetaLine && (
        <p className="mt-4 text-sm uppercase tracking-wide opacity-70">
          {formattedDate && <time dateTime={date}>{formattedDate}</time>}
          {author && <> · {author}</>}
          {readingTime && <> · {readingTime}</>}
        </p>
      )}
      {/* The "thesis sticker" (not font-display — this is freely-authored copy, so
          DEC-023's ASCII constraint doesn't apply): a card that reads as a physical
          label stuck onto the branded background, promoted above body weight but
          subordinate to the title.
          It inverts the page's own association — filled in the ink, lettered in the
          surface — so it separates itself by construction on all ten pairs, where the
          paper-and-ink card it used to be would have vanished on a paper surface. The
          drop shadow is the one place the accent appears at this size. */}
      {thesis && (
        <blockquote className="mt-8 max-w-prose -rotate-1 bg-[var(--blog-ink)] px-6 py-5 text-[var(--blog-surface)] shadow-[6px_6px_0_var(--blog-accent)]">
          <p className="text-[clamp(1.25rem,1.05rem+1.4vw,1.75rem)] leading-snug font-semibold">{thesis}</p>
        </blockquote>
      )}
    </header>
  );
}
