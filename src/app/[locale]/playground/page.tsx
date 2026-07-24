import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CounterChip } from "@/components/playground/counter-chip";
import { EffectCard } from "@/components/playground/effect-card";
import { playgroundEffects } from "@/components/playground/effects";
import { SubpageHero } from "@/components/subpage-hero";
import { content } from "@/content/site";
import { routing } from "@/i18n/routing";
import { sectionMetadata } from "../section-metadata";

const ROUTE = "/playground";

// Static like every other section route: the registry is a build-time module, not
// fetched content, so there is nothing here that needs the /cases or /blog webhook
// re-render contract.

type RouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return sectionMetadata(locale, ROUTE, content[locale].playground.lead);
}

export default async function PlaygroundPage({ params }: RouteProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Static rendering only holds while the locale is declared up front — without this
  // every next-intl call below reads headers() and the route turns dynamic.
  setRequestLocale(locale);

  const { nav, playground } = content[locale];
  const title = nav.find((item) => item.href === ROUTE)?.label;
  if (!title) {
    throw new Error(`No ${locale} nav entry points at ${ROUTE}.`);
  }

  return (
    // The surface has to be carried by a full-height wrapper, not by the grid alone:
    // `main` is a flex child that grows to the viewport, so a short page would otherwise
    // end early and reveal the paper-white body underneath it as a stray band.
    <div className="min-h-dvh bg-brutal text-ink">
      <SubpageHero
        page="playground"
        title={[title]}
        lead={playground.lead}
        titleSizeClassName="text-[clamp(2.25rem,7vw,5.75rem)]"
      >
        <CounterChip locale={locale} copy={playground.counter} />
      </SubpageHero>

      <section className="px-5 pb-20 md:px-8 md:pb-32">
        {playgroundEffects.length === 0 ? (
          <p className="max-w-prose text-lg leading-relaxed text-ink/70">{playground.emptyState}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {playgroundEffects.map((effect) => (
              <EffectCard
                key={effect.id}
                href={`${ROUTE}/${effect.slug}`}
                title={effect.title[locale]}
                hook={effect.description[locale]}
                playLabel={playground.play}
                preview={effect.preview}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
