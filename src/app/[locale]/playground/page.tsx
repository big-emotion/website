import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { playgroundEffects } from "@/components/playground/effects";
import { content } from "@/content/site";
import { Link } from "@/i18n/navigation";
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
    <section className="bg-brutal px-5 py-20 text-ink md:px-8 md:py-32">
      <h1 className="font-display text-[clamp(2.75rem,9vw,7rem)]">{title}</h1>
      <p className="mt-6 max-w-[44ch] text-lg leading-relaxed">{playground.lead}</p>

      {playgroundEffects.length === 0 ? (
        <p className="mt-14 max-w-prose text-lg leading-relaxed text-ink/70">
          {playground.emptyState}
        </p>
      ) : (
        <div className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {playgroundEffects.map((effect) => (
            <Link key={effect.id} href={`${ROUTE}/${effect.slug}`} className="block">
              {effect.slug}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
