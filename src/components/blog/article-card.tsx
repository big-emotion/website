import Image from "next/image";
import { HEADING_LINK } from "@/components/heading-link";
import { Link } from "@/i18n/navigation";

export interface ArticleCardCover {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ArticleCardProps {
  /** Locale-agnostic path (e.g. "/blog/le-brief-qui-change-tout") — `Link` adds the locale prefix. */
  href: string;
  title: string;
  /** Nature of the piece (e.g. "Strategie de marque") — same eyebrow role as case_study's `kind`. */
  kind: string;
  excerpt: string;
  cover?: ArticleCardCover;
}

/**
 * A card previewing an article on a listing surface. Content types, routes and
 * data-fetching are SWBE-82 — this component only renders the props it is given.
 */
export function ArticleCard({ href, title, kind, excerpt, cover }: ArticleCardProps) {
  return (
    <article className="border-t-2 border-ink pt-6">
      {cover ? (
        <Image
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          className="mb-4 h-48 w-full object-cover"
        />
      ) : (
        <div aria-hidden="true" className="mb-4 h-48 w-full bg-current opacity-10" />
      )}
      {/* Title and kind land in font-display slots: BBH Hegarty has an ASCII-only cmap
          (DEC-023), so Prismic authors must keep this copy unaccented. */}
      <p className="font-display text-sm uppercase tracking-wide opacity-70">{kind}</p>
      <h3 className="font-display mt-2 text-[clamp(1.4rem,5vw,2.5rem)] [overflow-wrap:anywhere]">
        <Link href={href} className={HEADING_LINK}>
          {title}
        </Link>
      </h3>
      <p className="mt-3 max-w-prose text-base leading-relaxed opacity-90">{excerpt}</p>
    </article>
  );
}
