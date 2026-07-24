import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CounterChip } from "@/components/playground/counter-chip";
import { EffectStage } from "@/components/playground/effect-stage";
import { playgroundEffects, type PlaygroundEffect } from "@/components/playground/effects";
import { EffectHud } from "@/components/playground/hud";
import { content, site } from "@/content/site";
import { locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { alternateLanguages, localePath, localeUrl, openGraphLocales } from "@/i18n/urls";

const ROUTE = "/playground";

// Static like the gallery it hangs off: the registry is a build-time module, so every
// registered effect is known at build time and none of this needs a Prismic-style
// publish-webhook re-render contract (REQ-038's "registry-driven growth").

type RouteProps = { params: Promise<{ locale: string; effect: string }> };

export function generateStaticParams() {
  return playgroundEffects.flatMap((effect) =>
    locales.map((locale) => ({ locale, effect: effect.slug })),
  );
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale, effect: slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const effect = findEffect(slug);
  const href = `${ROUTE}/${slug}`;
  const title = effect.title[locale];
  const description = effect.description[locale];

  return {
    title,
    description,
    alternates: {
      canonical: localePath(locale, href),
      languages: alternateLanguages(href),
    },
    // No `openGraph.images` here — the colocated opengraph-image.tsx in this same
    // segment is picked up automatically, and pinning one here would fight it (DEC-034).
    openGraph: {
      type: "website",
      siteName: site.name,
      url: localeUrl(locale, href),
      title,
      description,
      ...openGraphLocales(locale),
    },
  };
}

export default async function PlaygroundEffectPage({ params }: RouteProps) {
  const { locale, effect: slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Static rendering only holds while the locale is declared up front — without this
  // every next-intl call below reads headers() and the route turns dynamic.
  setRequestLocale(locale);

  const effect = findEffect(slug);
  const { playground } = content[locale];
  const href = `${ROUTE}/${slug}`;

  return (
    // Grey all the way down, like the gallery this page hangs off: the stage used to
    // inherit nothing, so the chrome logo was lit against the body's paper white.
    <article className="min-h-dvh bg-brutal text-ink">
      <EffectHud
        title={effect.title[locale]}
        backHref={ROUTE}
        shareUrl={localeUrl(locale, href)}
        copy={{ back: playground.back, share: playground.share }}
        stage={
          <EffectStage
            effect={effect}
            fallback={
              <p role="status" aria-live="polite" className="px-5 py-20 md:px-8">
                {playground.loading}
              </p>
            }
          />
        }
      >
        <CounterChip locale={locale} copy={playground.counter} />
        {/* Challenge badge (story 7) slots in here once that story ships. */}
      </EffectHud>
    </article>
  );
}

function findEffect(slug: string): PlaygroundEffect {
  const effect = playgroundEffects.find((candidate) => candidate.slug === slug);
  if (!effect) notFound();
  return effect;
}
