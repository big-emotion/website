import type { Locale } from "@/i18n/locales";

export interface ArticleHeaderProps {
  locale: Locale;
  title: string;
  /** Nature of the piece (e.g. "Strategie de marque") — same eyebrow role as case_study's `kind`. */
  kind: string;
  /** ISO 8601 date (e.g. "2026-07-21"); formatted for display, kept raw in `<time datetime>`. */
  date: string;
  author?: string;
  readingTime?: string;
}

/**
 * The branded hero for an article page. Content types, routes and data-fetching are
 * SWBE-82 — this component only renders the props it is given.
 */
export function ArticleHeader({ locale, title, kind, date, author, readingTime }: ArticleHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(date));

  return (
    <header className="border-b-2 border-ink pb-8">
      {/* Title and kind land in font-display slots: BBH Hegarty has an ASCII-only cmap
          (DEC-023), so Prismic authors must keep this copy unaccented. */}
      <p className="font-display text-sm uppercase tracking-wide opacity-70">{kind}</p>
      <h1 className="font-display mt-2 text-[clamp(2rem,8vw,5rem)] [overflow-wrap:anywhere]">{title}</h1>
      <p className="mt-4 text-sm uppercase tracking-wide opacity-70">
        <time dateTime={date}>{formattedDate}</time>
        {author && <> · {author}</>}
        {readingTime && <> · {readingTime}</>}
      </p>
    </header>
  );
}
