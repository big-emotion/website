import { asText } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HEADING_LINK } from "@/components/heading-link";
import { content } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatPublishDate } from "@/lib/display-date";
import { createClient, prismicLocale } from "@/prismicio";
import { sectionMetadata } from "../section-metadata";

const ROUTE = "/blog";

// Same contract as /cases (SWBE-80): deliberately unpinned so the publish webhook can
// regenerate this page without a deploy — `force-static`/`dynamic` would freeze it.

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return sectionMetadata(locale, ROUTE, content[locale].blog.lead);
}

export default async function BlogPage({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const { nav, blog } = content[locale];
  const title = nav.find((item) => item.href === ROUTE)?.label;
  if (!title) {
    throw new Error(`No ${locale} nav entry points at ${ROUTE}.`);
  }

  // Ordered by an explicit editorial field (the article's own publish date), not by
  // Prismic's system publication timestamp — mirroring the /cases display_order lesson,
  // an implicit timestamp would tie and vary between builds for articles published in
  // the same batch.
  const articles = await createClient().getAllByType("article", {
    lang: prismicLocale(locale),
    orderings: [{ field: "my.article.publish_date", direction: "desc" }],
  });

  return (
    <section className="bg-lyon px-5 py-20 text-paper md:px-8 md:py-32">
      <h1 className="font-display text-[clamp(2.75rem,9vw,7rem)] text-lemon">{title}</h1>
      <p className="mt-6 max-w-prose text-lg leading-relaxed opacity-90">{blog.lead}</p>

      {articles.length === 0 ? (
        <p className="mt-14 max-w-prose text-lg leading-relaxed opacity-70">{blog.emptyState}</p>
      ) : (
        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-8">
          {articles.map((article) => (
            <article key={article.id} className="border-t-2 border-paper pt-6">
              <PrismicNextImage
                field={article.data.cover}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-auto w-full"
              />
              {article.data.publish_date && (
                <p className="font-display mt-4 text-sm uppercase tracking-wide opacity-70">
                  {formatPublishDate(locale, article.data.publish_date)}
                </p>
              )}
              <h2 className="font-display mt-2 text-[clamp(1.6rem,7vw,4rem)] text-lemon [overflow-wrap:anywhere]">
                <Link href={`/blog/${article.uid}`} className={HEADING_LINK}>
                  {article.data.title}
                </Link>
              </h2>
              <p className="mt-4 max-w-prose text-lg leading-relaxed">
                {asText(article.data.excerpt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
