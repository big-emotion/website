import { HEADING_LINK } from "@/components/heading-link";
import { Link } from "@/i18n/navigation";

export interface ArticleCardProps {
  /** Locale-agnostic path (e.g. "/blog/le-jugement-ne-se-reproduit-pas") — `Link` adds the locale prefix. */
  href: string;
  title: string;
  /** Already formatted for display (`formatArticleDate`), so the card stays presentational. */
  date: string;
}

/**
 * A row in the demoted index below the featured post (Direction B): date + title only,
 * no cover or excerpt — the weight belongs to the lead article above. The whole card
 * lifts on hover/focus to signal it is one target.
 *
 * The title is Bricolage, not `font-display`: BBH Hegarty is uppercase-only with an
 * ASCII cmap (DEC-023), which mangles a sentence-case French headline like
 * "L'humain est le nouveau CI/CD de l'IA". Its permanent tangerine underline (never a
 * hover-only reveal) keeps the link legible as a link on touch — see `heading-link.ts`.
 */
export function ArticleCard({ href, title, date }: ArticleCardProps) {
  return (
    <article className="border-t-2 border-paper pt-4 transition-transform duration-200 ease-out motion-reduce:transition-none hover:-translate-y-1.5 focus-within:-translate-y-1.5">
      <p className="text-sm uppercase tracking-wide text-paper/70">{date}</p>
      <h3 className="mt-3 text-[clamp(1.3rem,6vw,1.7rem)] leading-snug font-bold tracking-tight text-balance break-words">
        <Link href={href} className={`${HEADING_LINK} decoration-tangerine`}>
          {title}
        </Link>
      </h3>
    </article>
  );
}
