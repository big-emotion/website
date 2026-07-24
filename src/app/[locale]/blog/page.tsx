import { asText } from "@prismicio/client";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/article-card";
import { FeaturedArticle } from "@/components/blog/featured-article";
import { SubpageHero } from "@/components/subpage-hero";
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
  // the rest fall into a calm date-and-title index. Weight and space carry that step,
  // not a second colour — the page has two. `getAllByType` already returned them newest-first.
  const [featured, ...rest] = articles;
  const postCount = articles.length === 1 ? blog.postCount.one : blog.postCount.other;

  return (
    // Same band as every other section route (SubpageHero), so the blog opens on the
    // photo-beside-the-title layout instead of the bare heading it shipped with. The
    // index below keeps the surface the hero paints, which is what makes this one
    // continuous page rather than a hero stapled onto a different section.
    <>
      <SubpageHero page="blog" title={[title]} lead={blog.lead}>
        {/* Filled in the association's own ink, so the count reads on whichever pair the
            blog wears rather than assuming a tangerine-on-lyon chip. */}
        {articles.length > 0 && (
          <span className="rounded-full bg-[var(--blog-ink)] px-3 py-1 text-sm font-bold uppercase tracking-wide text-[var(--blog-surface)]">
            {articles.length} {postCount}
          </span>
        )}
      </SubpageHero>

      {/* The top padding is load-bearing: without it the first child's top margin
          collapses straight through this section, dragging it down the page and leaving
          a band of the white body background under the hero. */}
      <section className="bg-[var(--blog-surface)] px-5 pt-14 pb-20 text-[var(--blog-ink)] md:px-8 md:pt-20 md:pb-32">
        {articles.length === 0 ? (
          <p className="max-w-prose text-lg leading-relaxed opacity-70">{blog.emptyState}</p>
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
    </>
  );
}
