import type { Content } from "@prismicio/client";
import { asText, isFilled } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { SliceZone } from "@prismicio/react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleHeader } from "@/components/blog/article-header";
import { content, site } from "@/content/site";
import { locales, type Locale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { alternateLanguagesAmong, localePath, localeUrl, openGraphLocales } from "@/i18n/urls";
import { createClient, prismicLocale } from "@/prismicio";
import { components } from "@/slices";

// Same contract as /cases/[uid]: pre-rendered, refreshed by the publish webhook rather
// than a deploy. `generateStaticParams` covers what existed at build time; `dynamicParams`
// (on by default) renders anything published later on first request.

type RouteProps = { params: Promise<{ locale: string; uid: string }> };

export async function generateStaticParams() {
  const client = createClient();

  return (
    await Promise.all(
      locales.map(async (locale) =>
        (await client.getAllByType("article", { lang: prismicLocale(locale) })).map((article) => ({
          locale,
          uid: article.uid!,
        })),
      ),
    )
  ).flat();
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale, uid } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const article = await fetchArticle(locale, uid);
  if (!article) notFound();

  // The requesting locale is known to exist; only the other one needs a probe. An
  // article with no automatic locale fallback (REQ-028) must not advertise an hreflang
  // alternate that 404s, so the missing language is left out rather than guessed.
  const otherLocales = await Promise.all(
    routing.locales
      .filter((other) => other !== locale)
      .map(async (other) => ((await fetchArticle(other, uid)) ? other : null)),
  );
  const availableLocales = [locale, ...otherLocales.filter((l): l is Locale => l !== null)];

  const description = asText(article.data.excerpt) ?? undefined;
  const href = `/blog/${uid}`;

  return {
    title: article.data.title,
    description,
    alternates: {
      canonical: localePath(locale, href),
      languages: alternateLanguagesAmong(href, availableLocales),
    },
    openGraph: {
      type: "article",
      siteName: site.name,
      url: localeUrl(locale, href),
      title: article.data.title ?? undefined,
      description,
      ...openGraphLocales(locale),
    },
  };
}

export default async function ArticlePage({ params }: RouteProps) {
  const { locale, uid } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const article = await fetchArticle(locale, uid);
  if (!article) notFound();

  const { title, excerpt, publish_date, cover, author, body } = article.data;
  const authorDoc = await fetchAuthor(locale, author);

  return (
    <article className="bg-lyon px-5 py-20 text-paper md:px-8 md:py-32">
      <ArticleHeader
        locale={locale}
        title={title ?? ""}
        date={publish_date ?? undefined}
        author={authorDoc ? `${content[locale].blog.byline} ${authorDoc.data.name}` : undefined}
        thesis={asText(excerpt) || undefined}
      />

      <PrismicNextImage
        field={cover}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="mt-10 h-auto w-full"
      />

      <SliceZone slices={body} components={components} />
    </article>
  );
}

async function fetchArticle(locale: Locale, uid: string): Promise<Content.ArticleDocument | null> {
  try {
    return await createClient().getByUID("article", uid, { lang: prismicLocale(locale) });
  } catch {
    // A uid with no document in this locale answers exactly like an unknown path, so an
    // untranslated article can't leak its existence to the other locale.
    return null;
  }
}

async function fetchAuthor(
  locale: Locale,
  authorField: Content.ArticleDocument["data"]["author"],
): Promise<Content.AuthorDocument | null> {
  if (!isFilled.contentRelationship(authorField)) return null;

  try {
    const document = await createClient().getByID(authorField.id, { lang: prismicLocale(locale) });
    return document.type === "author" ? (document as Content.AuthorDocument) : null;
  } catch {
    return null;
  }
}
