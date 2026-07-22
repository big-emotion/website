import { asText } from "@prismicio/client";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/article-card";
import { FeaturedArticle } from "@/components/blog/featured-article";
import { content } from "@/content/site";
import { routing } from "@/i18n/routing";
import { formatArticleDate } from "@/lib/display-date";
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

  // Direction B's hierarchy: the newest post is promoted to the single featured block,
  // the rest fall into a calm date-and-title index. Lemon is spent on the hero title
  // alone; tangerine carries interaction. `getAllByType` already returned them newest-first.
  const [featured, ...rest] = articles;
  const postCount = articles.length === 1 ? blog.postCount.one : blog.postCount.other;

  return (
    <section className="bg-lyon px-5 py-20 text-paper md:px-8 md:py-32">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="font-display text-[clamp(2.75rem,9vw,7rem)] text-lemon">{title}</h1>
        {articles.length > 0 && (
          <span className="rounded-full bg-tangerine px-3 py-1 text-sm font-bold uppercase tracking-wide text-ink">
            {articles.length} {postCount}
          </span>
        )}
      </div>
      <p className="mt-6 max-w-[44ch] text-lg leading-relaxed">{blog.lead}</p>

      {articles.length === 0 ? (
        <p className="mt-14 max-w-prose text-lg leading-relaxed text-paper/70">{blog.emptyState}</p>
      ) : (
        <>
          <FeaturedArticle
            href={`/blog/${featured.uid}`}
            label={blog.featuredLabel}
            title={featured.data.title ?? ""}
            excerpt={asText(featured.data.excerpt)}
            date={
              featured.data.publish_date
                ? formatArticleDate(locale, featured.data.publish_date)
                : ""
            }
            readMore={blog.readMore}
          />

          {rest.length > 0 && (
            <div className="mt-14 grid gap-x-8 gap-y-10 md:mt-20 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard
                  key={article.id}
                  href={`/blog/${article.uid}`}
                  title={article.data.title ?? ""}
                  date={
                    article.data.publish_date
                      ? formatArticleDate(locale, article.data.publish_date)
                      : ""
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
